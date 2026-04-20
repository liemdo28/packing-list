/**
 * stress/sql/integrity-checks.sql
 *
 * Run these checks after any stress test to verify DB integrity.
 * Designed for MySQL 8.0 — adapt column names if your schema differs.
 *
 * Usage (MySQL CLI):
 *   mysql -u root -p packing_list < stress/sql/integrity-checks.sql
 *
 * Usage (with output file):
 *   mysql -u root -p packing_list < stress/sql/integrity-checks.sql > stress/reports/sql-integrity.txt
 */

-- ════════════════════════════════════════════════════════════════════════════
-- 1. Duplicate completed snapshots (should be exactly 1 per order)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'DUPLICATE_COMPLETED_SNAPSHOTS' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(DISTINCT order_id ORDER BY order_id) AS affected_order_ids
FROM (
  SELECT order_id, COUNT(*) AS cnt
  FROM order_lines
  WHERE unit_price IS NOT NULL AND unit_price > 0
  GROUP BY order_id
  HAVING cnt > 1
) AS duplicates;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. No order in multiple terminal states simultaneously
-- ════════════════════════════════════════════════════════════════════════════
-- An order should only be in ONE of these terminal statuses at once
SELECT
  'MULTIPLE_TERMINAL_STATES' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(CONCAT('order#', id, '=', status) ORDER BY id) AS details
FROM orders
WHERE status IN ('completed', 'cancelled', 'disputed')
  AND (
    (status = 'completed' AND cancelled_at IS NOT NULL)
    OR (status = 'cancelled' AND completed_at IS NOT NULL)
    OR (status = 'disputed' AND completed_at IS NOT NULL)
  );

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Completed orders missing price snapshot (data inconsistency)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'COMPLETED_MISSING_SNAPSHOT' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(DISTINCT o.id ORDER BY o.id) AS affected_order_ids
FROM orders o
LEFT JOIN order_lines ol ON ol.order_id = o.id AND ol.unit_price IS NOT NULL
WHERE o.status = 'completed'
GROUP BY o.id
HAVING COUNT(ol.id) = 0;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Orders stuck in non-terminal state with no activity for 7+ days
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'STALE_NON_TERMINAL' AS check_name,
  COUNT(*) AS issue_count,
  MIN(updated_at) AS oldest_stale_date,
  MAX(updated_at) AS newest_stale_date
FROM orders
WHERE status NOT IN ('completed', 'cancelled', 'disputed')
  AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Summary vs. real aggregation mismatch
-- (run after any soak test to validate monthly_summaries table)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'SUMMARY_MISMATCH' AS check_name,
  COUNT(*) AS mismatch_count
FROM monthly_summaries ms
LEFT JOIN (
  SELECT
    YEAR(o.completed_at) AS yr,
    MONTH(o.completed_at) AS mo,
    o.from_store_id,
    o.to_store_id,
    COALESCE(SUM(ol.line_total), 0) AS real_total
  FROM orders o
  JOIN order_lines ol ON ol.order_id = o.id
  WHERE o.status = 'completed'
  GROUP BY yr, mo, o.from_store_id, o.to_store_id
) AS real ON real.yr = ms.year
  AND real.mo = ms.month
  AND real.from_store_id = ms.from_store_id
  AND real.to_store_id = ms.to_store_id
WHERE ABS(COALESCE(real.real_total, 0) - ms.total_amount) > 0.01;

-- ════════════════════════════════════════════════════════════════════════════
-- 6. Line total arithmetic check (unit_price × qty vs stored line_total)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'LINE_TOTAL_MISMATCH' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(
    CONCAT('line#', id, ' order#', order_id, ': stored=', line_total, ' calc=', ROUND(unit_price * final_qty, 2))
    ORDER BY id SEPARATOR '; '
  ) AS details
FROM order_lines
WHERE unit_price IS NOT NULL
  AND final_qty IS NOT NULL
  AND line_total IS NOT NULL
  AND ABS(line_total - ROUND(unit_price * final_qty, 2)) > 0.01;

-- ════════════════════════════════════════════════════════════════════════════
-- 7. Negative quantities (invalid data)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'NEGATIVE_QUANTITIES' AS check_name,
  COUNT(*) AS issue_count
FROM order_lines
WHERE requested_qty < 0
   OR (shipped_qty < 0 AND shipped_qty IS NOT NULL)
   OR (final_qty < 0 AND final_qty IS NOT NULL);

-- ════════════════════════════════════════════════════════════════════════════
-- 8. Duplicate order numbers (should be unique)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'DUPLICATE_ORDER_NUMBERS' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(DISTINCT order_number ORDER BY order_number) AS duplicates
FROM orders
GROUP BY order_number
HAVING COUNT(*) > 1;

-- ════════════════════════════════════════════════════════════════════════════
-- 9. Orders with zero order_lines (orphaned header)
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'ORDER_WITHOUT_LINES' AS check_name,
  COUNT(*) AS issue_count,
  GROUP_CONCAT(DISTINCT id ORDER BY id) AS details
FROM orders
WHERE id NOT IN (SELECT DISTINCT order_id FROM order_lines);

-- ════════════════════════════════════════════════════════════════════════════
-- 10. Monthly summary unique constraint check
-- ════════════════════════════════════════════════════════════════════════════
SELECT
  'DUPLICATE_MONTHLY_SUMMARY' AS check_name,
  COUNT(*) - COUNT(DISTINCT CONCAT(year, '-', month, '-', from_store_id, '-', to_store_id)) AS duplicates
FROM monthly_summaries;