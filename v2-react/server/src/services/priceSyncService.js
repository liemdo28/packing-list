/**
 * PriceSyncService
 *
 * Syncs pricing data from a public Google Sheet into price_master.
 * Architecture:
 *   Google Sheet (CSV export)
 *     → parse columns (Item | Month1 | Month2 | ...)
 *     → upsert price_master rows (one row per item per month)
 *     → write price_audit_logs for every changed value
 *     → write price_sync_logs for every run
 *
 * Failure safety:
 *   - DB is the source of truth; Sheet is the sync source
 *   - If Sheet is unreachable, existing DB prices are used (no crash)
 *   - Each sync run is atomic per-item (partial success is logged)
 */

const https  = require('https');
const http   = require('http');
const { Op } = require('sequelize');
const { sequelize, Item, PriceMaster } = require('../models');

// ── Config ───────────────────────────────────────────────────────────────────

const SHEET_ID   = process.env.PRICING_SHEET_ID
                || '1Ve-7_GNfy23pFw9mQhuwv-DWx5DHuwhVy6FmG0fOIUc';
const SHEET_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const FETCH_TIMEOUT_MS = 20_000;

// ── HTTP helper (no axios dependency) ────────────────────────────────────────

function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: FETCH_TIMEOUT_MS }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        return resolve(fetchUrl(res.headers.location, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Fetch timeout')); });
  });
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line) => {
    const cols = [];
    let inQuote = false, cur = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(lines[0]);
  const rows    = lines.slice(1).map(parseRow);
  return { headers, rows };
}

// Converts "Jan 2024" → "2024-01-01", "Mar 2026" → "2026-03-01", etc.
function parseMonthHeader(header) {
  const months = {
    Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,
    June:6,Jul:7,July:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12,
  };
  const m = header.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mo = months[m[1]];
  if (!mo) return null;
  return `${m[2]}-${String(mo).padStart(2, '0')}-01`;
}

function parsePrice(str) {
  if (!str) return null;
  const num = parseFloat(str.replace(/[$,\s]/g, ''));
  return isNaN(num) || num <= 0 ? null : num;
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function logSync(db, id, patch) {
  await db.query(
    `UPDATE price_sync_logs SET ${Object.keys(patch).map(k => `${k}=?`).join(',')} WHERE id=?`,
    { replacements: [...Object.values(patch), id] }
  );
}

async function createSyncLog(db, data) {
  const [res] = await db.query(
    `INSERT INTO price_sync_logs (status,sheet_url,triggered_by,started_at) VALUES (?,?,?,NOW())`,
    { replacements: [data.status, data.sheetUrl, data.triggeredBy] }
  );
  return res;
}

async function writeAuditLog(db, { itemId, itemName, oldPrice, newPrice, effectiveDate, changedBy, source }) {
  await db.query(
    `INSERT INTO price_audit_logs (item_id,item_name,old_price,new_price,effective_date,changed_by,source) VALUES (?,?,?,?,?,?,?)`,
    { replacements: [itemId, itemName, oldPrice ?? null, newPrice, effectiveDate, changedBy, source] }
  );
}

// ── Core sync logic ───────────────────────────────────────────────────────────

async function runSync({ triggeredBy = 'scheduled' } = {}) {
  const syncId = await createSyncLog(sequelize, {
    status: 'running',
    sheetUrl: SHEET_URL,
    triggeredBy,
  });

  const result = {
    syncId,
    status: 'success',
    itemsSynced: 0,
    itemsUpdated: 0,
    itemsFailed: 0,
    itemsMissing: 0,
    errors: [],
    warnings: [],
  };

  try {
    // 1. Fetch CSV
    console.log(`[price-sync] Fetching ${SHEET_URL}`);
    const csv = await fetchUrl(SHEET_URL);
    const { headers, rows } = parseCSV(csv);

    if (!headers.length) throw new Error('Empty or invalid CSV from Google Sheet');

    // headers[0] = "Item", headers[1..N] = "Jan 2024", "Feb 2024", ...
    const monthHeaders = headers.slice(1);
    const dateCols = monthHeaders.map(h => ({
      label: h,
      date: parseMonthHeader(h),
    }));

    console.log(`[price-sync] Columns: ${dateCols.map(c => c.label).join(', ')}`);
    console.log(`[price-sync] Rows: ${rows.length}`);

    // 2. Build item lookup (name → DB item)
    const allItems = await Item.findAll({ attributes: ['id','name','code'] });
    const itemByName = new Map();
    for (const item of allItems) {
      itemByName.set(item.name.trim().toLowerCase(), item);
    }

    // 3. Process each row
    for (const row of rows) {
      const rawName = row[0]?.replace(/"/g, '').trim();
      if (!rawName) continue;

      const dbItem = itemByName.get(rawName.toLowerCase());
      if (!dbItem) {
        result.itemsMissing++;
        result.warnings.push(`Item not in DB: "${rawName}"`);
        continue;
      }

      const t = await sequelize.transaction();
      try {
        let lastActiveDate = null;
        let lastActivePrice = null;

        // Find rightmost non-null price (= current/latest price)
        for (let ci = dateCols.length - 1; ci >= 0; ci--) {
          const price = parsePrice(row[ci + 1]);
          if (price !== null && dateCols[ci].date) {
            lastActiveDate  = dateCols[ci].date;
            lastActivePrice = price;
            break;
          }
        }

        // Deactivate all existing prices for this item first
        if (lastActiveDate) {
          await PriceMaster.update(
            { is_active: false },
            { where: { item_id: dbItem.id }, transaction: t }
          );
        }

        // Upsert each month column
        for (let ci = 0; ci < dateCols.length; ci++) {
          const { date, label } = dateCols[ci];
          if (!date) continue;
          const newPrice = parsePrice(row[ci + 1]);
          if (newPrice === null) continue;

          const isActive = (date === lastActiveDate);

          // Find existing
          const [existing] = await PriceMaster.findAll({
            where: { item_id: dbItem.id, effective_date: date },
            lock: true,
            transaction: t,
          });

          if (existing) {
            const oldPrice = parseFloat(existing.price);
            if (Math.abs(oldPrice - newPrice) > 0.001) {
              await existing.update({ price: newPrice, is_active: isActive }, { transaction: t });
              await writeAuditLog(sequelize, {
                itemId: dbItem.id, itemName: dbItem.name,
                oldPrice, newPrice,
                effectiveDate: date, changedBy: triggeredBy, source: 'google_sheets',
              });
              if (isActive) result.itemsUpdated++;
            } else if (isActive && !existing.is_active) {
              await existing.update({ is_active: true }, { transaction: t });
            }
          } else {
            await PriceMaster.create({
              item_id: dbItem.id, price: newPrice,
              effective_date: date, end_date: null,
              is_active: isActive,
            }, { transaction: t });
            await writeAuditLog(sequelize, {
              itemId: dbItem.id, itemName: dbItem.name,
              oldPrice: null, newPrice,
              effectiveDate: date, changedBy: triggeredBy, source: 'google_sheets',
            });
            if (isActive) result.itemsUpdated++;
          }
        }

        await t.commit();
        result.itemsSynced++;
      } catch (err) {
        await t.rollback();
        result.itemsFailed++;
        result.errors.push(`${rawName}: ${err.message}`);
        console.error(`[price-sync] Failed item "${rawName}":`, err.message);
      }
    }

    result.status = result.itemsFailed > 0 ? 'partial' : 'success';

  } catch (err) {
    result.status = 'failed';
    result.errors.push(err.message);
    console.error('[price-sync] Fatal error:', err.message);
  }

  // 4. Write final sync log
  await logSync(sequelize, syncId, {
    status:       result.status,
    items_synced: result.itemsSynced,
    items_updated: result.itemsUpdated,
    items_failed: result.itemsFailed,
    items_missing: result.itemsMissing,
    error_message: result.errors.length ? result.errors.join('\n') : null,
    completed_at:  new Date(),
  });

  console.log(`[price-sync] Done — synced:${result.itemsSynced} updated:${result.itemsUpdated} failed:${result.itemsFailed} missing:${result.itemsMissing}`);
  return result;
}

// ── Validation helpers ────────────────────────────────────────────────────────

async function getMissingPrices() {
  const [rows] = await sequelize.query(`
    SELECT i.id, i.code, i.name, i.category
    FROM items i
    LEFT JOIN price_master pm ON pm.item_id = i.id AND pm.is_active = 1
    WHERE i.is_active = 1 AND pm.id IS NULL
    ORDER BY i.category, i.name
  `);
  return rows;
}

async function getLastSync() {
  const [rows] = await sequelize.query(
    `SELECT * FROM price_sync_logs ORDER BY id DESC LIMIT 1`
  );
  return rows[0] || null;
}

async function getSyncHistory(limit = 10) {
  const [rows] = await sequelize.query(
    `SELECT * FROM price_sync_logs ORDER BY id DESC LIMIT ?`,
    { replacements: [limit] }
  );
  return rows;
}

async function getPriceAudit({ itemId, limit = 50 } = {}) {
  const where = itemId ? `WHERE item_id = ${parseInt(itemId)}` : '';
  const [rows] = await sequelize.query(
    `SELECT pal.*, i.code as item_code
     FROM price_audit_logs pal
     LEFT JOIN items i ON i.id = pal.item_id
     ${where}
     ORDER BY pal.id DESC LIMIT ?`,
    { replacements: [limit] }
  );
  return rows;
}

async function getCurrentPrices() {
  const [rows] = await sequelize.query(`
    SELECT i.id, i.code, i.name, i.unit, i.category,
           pm.price, pm.effective_date, pm.id as price_id
    FROM items i
    LEFT JOIN price_master pm ON pm.item_id = i.id AND pm.is_active = 1
    WHERE i.is_active = 1
    ORDER BY i.category, i.name
  `);
  return rows;
}

// ── Table bootstrap ───────────────────────────────────────────────────────────

async function ensureSyncTables() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS price_sync_logs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      status        VARCHAR(20)  NOT NULL DEFAULT 'running',
      sheet_url     TEXT,
      triggered_by  VARCHAR(100),
      items_synced  INT          DEFAULT 0,
      items_updated INT          DEFAULT 0,
      items_failed  INT          DEFAULT 0,
      items_missing INT          DEFAULT 0,
      error_message TEXT,
      started_at    DATETIME     NOT NULL,
      completed_at  DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS price_audit_logs (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      item_id        INT,
      item_name      VARCHAR(255),
      old_price      DECIMAL(10,2),
      new_price      DECIMAL(10,2) NOT NULL,
      effective_date DATE,
      changed_by     VARCHAR(100),
      source         VARCHAR(50),
      created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_item_id (item_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('[price-sync] Sync tables verified');
}

module.exports = {
  ensureSyncTables,
  runSync,
  getMissingPrices,
  getLastSync,
  getSyncHistory,
  getPriceAudit,
  getCurrentPrices,
  SHEET_URL,
};
