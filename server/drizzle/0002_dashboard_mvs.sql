-- Custom Migration: Dashboard Materialized View & Secure Wrapper View
-- Axiom: High-performance pre-aggregated metrics with tenant isolation.

-- 1. Cleanup
DROP VIEW IF EXISTS dashboard_metrics;
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_metrics_data;

-- 2. Create Internal Materialized View (Raw Aggregates)
CREATE MATERIALIZED VIEW mv_dashboard_metrics_data AS
SELECT 
  o.id as organization_id,
  (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM sales_orders so
    WHERE so.organization_id = o.id
    AND so.status != 'cancelled'
  ) as total_sales,
  (
    SELECT COALESCE(SUM(total_amount), 0)
    FROM purchase_orders po
    WHERE po.organization_id = o.id
    AND po.status != 'cancelled'
  ) as total_purchases,
  (
    SELECT COUNT(*)
    FROM customers c
    WHERE c.organization_id = o.id
  ) as active_customers,
  (
    SELECT COUNT(*)
    FROM products p
    WHERE p.organization_id = o.id
  ) as total_products
FROM organizations o;

-- 3. Create Unique Index for Concurrent Refresh
CREATE UNIQUE INDEX mv_dashboard_metrics_data_org_idx ON mv_dashboard_metrics_data (organization_id);

-- 4. Create Secure View Wrapper (Enforces Multi-Tenancy)
-- Axiom: This view leverages the app.current_organization_id session variable.
CREATE VIEW dashboard_metrics AS
SELECT * FROM mv_dashboard_metrics_data
WHERE organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid;

-- Note: RLS is not supported on Materialized Views. 
-- The Secure View pattern provides equivalent isolation at the database level.
