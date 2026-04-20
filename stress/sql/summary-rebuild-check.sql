/**
 * stress/sql/summary-rebuild-check.sql
 *
 * Rebuilds monthly_summaries from completed orders and compares
 * the rebuild result against the stored summary values.
 *
 * Use this after any stress test or before deploying to catch
 * summary drift caused by race conditions in incremental updates.
 *
 * Usage:
 *   mysql -u root -p packing_list < stress/sql/summary-rebuild-check.sql
 */

-- ─── Show current stored summary ───────────────────────────────────────────
SELECT
  'Current stored monthly_summaries' AS label;
SELECT
  year,
  month,
  from_store_id,
  to_store_id,
  total_orders,
  total_amount,
  generated_at
FROM monthly_summaries
ORDER BY year DESC, month DESC;

-- ─── Rebuilt summary from completed orders ─────────────────────────────────
SELECT
  'Rebuilt from completed orders (live aggregation)' AS label;
SELECT
  YEAR(o.completed_at) AS year,
  MONTH(o.completed_at) AS month,
  o.from_store_id,
  o.to_store_id,
  COUNT(DISTINCT o.id) AS total_orders,
  COALESCE(SUM(ol.line_total), 0) AS total_amount
FROM orders o
JOIN order_lines ol ON ol.order_id = o.id
WHERE o.status = 'completed'
  AND o.completed_at IS NOT NULL
GROUP BY YEAR(o.completed_at), MONTH(o.completed_at), o.from_store_id, o.to_store_id
ORDER BY year DESC, month DESC;

-- ─── Direct diff: stored vs. rebuilt ──────────────────────────────────────
SELECT
  'MISMATCH DETAIL (stored != rebuilt)' AS label;
SELECT
  ms.year,
  ms.month,
  ms.from_store_id,
  ms.to_store_id,
  ms.total_amount    AS stored_total,
  COALESCE(REAL.real_total, 0) AS rebuilt_total,
  ABS(ms.total_amount - COALESCE(REAL.real_total, 0)) AS drift,
  CASE
    WHEN ABS(ms.total_amount - COALESCE(REAL.real_total, 0)) < 0.01 THEN 'OK'
    ELSE 'DRIFT DETECTED'
  END AS status
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
) AS REAL ON REAL.yr = ms.year
  AND REAL.mo = ms.month
  AND REAL.from_store_id = ms.from_store_id
  AND REAL.to_store_id = ms.to_store_id
WHERE ABS(ms.total_amount - COALESCE(REAL.real_total, 0)) >= 0.01;

-- ─── Count of mismatches ──────────────────────────────────────────────────
SELECT
  'Mismatch count summary' AS label;
SELECT
  COUNT(*) AS total_mismatches,
  SUM(CASE WHEN ABS(ms.total_amount - COALESCE(REAL.real_total, 0)) >= 0.01 THEN 1 ELSE 0 END) AS rows_with_drift
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
) AS REAL ON REAL.yr = ms.year
  AND REAL.mo = ms.month
  AND REAL.from_store_id = ms.from_store_id
  AND REAL.to_store_id = ms.to_store_id;