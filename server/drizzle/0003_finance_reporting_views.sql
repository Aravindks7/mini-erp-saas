-- Custom Migration: Finance Reporting Views
-- Axiom: Decouple financial aggregation logic from the application layer into high-performance SQL views.

-- 1. Robust Cleanup
DO $$ 
BEGIN
    -- Drop views if they exist
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'report_finance_ledger') THEN
        DROP VIEW report_finance_ledger CASCADE;
    END IF;

    -- Drop materialized views if they exist
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_account_daily_balances') THEN
        DROP MATERIALIZED VIEW mv_account_daily_balances CASCADE;
    END IF;
END $$;

-- 2. Create Daily Account Balances Materialized View
-- Logic: Pre-aggregates debit/credit movements at the day level for rapid period-based reporting.
CREATE MATERIALIZED VIEW mv_account_daily_balances AS
SELECT 
    jel.organization_id,
    a.id as account_id,
    a.name as account_name,
    a.type as account_type,
    a.code as account_code,
    date_trunc('day', je.date) as balance_date,
    COALESCE(SUM(jel.debit), 0) as total_debit,
    COALESCE(SUM(jel.credit), 0) as total_credit
FROM journal_entry_lines jel
JOIN journal_entries je ON je.id = jel.journal_entry_id
JOIN accounts a ON a.id = jel.account_id
WHERE je.status = 'posted'
GROUP BY jel.organization_id, a.id, a.name, a.type, a.code, date_trunc('day', je.date);

-- 3. Create Unique Index for Concurrent Refresh
CREATE UNIQUE INDEX mv_account_daily_balances_idx ON mv_account_daily_balances (organization_id, account_id, balance_date);

-- 4. Create Secure Reporting View (Enforces Multi-Tenancy)
-- Axiom: Provides a clinical API for the FinanceService, abstracting join complexity.
CREATE VIEW report_finance_ledger AS
SELECT 
    *,
    CASE 
        WHEN account_type IN ('asset', 'expense') THEN total_debit - total_credit
        ELSE total_credit - total_debit
    END as net_balance
FROM mv_account_daily_balances
WHERE organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid;

-- 5. Discussion: Why Materialized Views?
-- In a multi-tenant ERP, the journal_entry_lines table can grow into the millions. 
-- By pre-aggregating into daily buckets, we reduce query complexity from O(Lines) to O(Days * Accounts).
-- For a typical organization with 100 accounts, a year of data is only 36,500 rows, which fits in memory.
