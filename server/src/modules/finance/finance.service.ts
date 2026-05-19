import { db } from '../../db/index.js';
import { reportFinanceLedger } from '../../db/schema/index.js';
import { and, sql, lte, between } from 'drizzle-orm';

export class FinanceService {
  /**
   * Generates a Profit & Loss (Income Statement) report.
   * Logic: Sum(Revenue) - Sum(Expenses) for a given date range.
   * Leverages 'report_finance_ledger' secure view.
   */
  async getProfitAndLoss(organizationId: string, startDate: Date, endDate: Date) {
    return await db.transaction(async (tx) => {
      // Set the session context for the Secure View filter
      await tx.execute(
        sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`,
      );

      const lines = await tx
        .select({
          accountId: reportFinanceLedger.accountId,
          accountName: reportFinanceLedger.accountName,
          type: reportFinanceLedger.accountType,
          balance: sql<number>`SUM(${reportFinanceLedger.netBalance})`,
        })
        .from(reportFinanceLedger)
        .where(
          and(
            between(reportFinanceLedger.balanceDate, startDate, endDate),
            sql`${reportFinanceLedger.accountType} IN ('revenue', 'expense')`,
          ),
        )
        .groupBy(
          reportFinanceLedger.accountId,
          reportFinanceLedger.accountName,
          reportFinanceLedger.accountType,
        );

      const revenue = lines
        .filter((l) => l.type === 'revenue')
        .reduce((sum, l) => sum + Number(l.balance), 0);

      const expenses = lines
        .filter((l) => l.type === 'expense')
        .reduce((sum, l) => sum + Number(l.balance), 0);

      return {
        revenue,
        expenses,
        netIncome: revenue - expenses,
        details: lines.map((l) => ({
          accountName: l.accountName,
          type: l.type,
          balance: Number(l.balance),
        })),
      };
    });
  }

  /**
   * Generates a Balance Sheet report.
   * Logic: Cumulative balances of Assets, Liabilities, and Equity up to endDate.
   * Leverages 'report_finance_ledger' secure view.
   */
  async getBalanceSheet(organizationId: string, endDate: Date) {
    return await db.transaction(async (tx) => {
      // Set the session context for the Secure View filter
      await tx.execute(
        sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`,
      );

      const lines = await tx
        .select({
          accountId: reportFinanceLedger.accountId,
          accountName: reportFinanceLedger.accountName,
          type: reportFinanceLedger.accountType,
          balance: sql<number>`SUM(${reportFinanceLedger.netBalance})`,
        })
        .from(reportFinanceLedger)
        .where(
          and(
            lte(reportFinanceLedger.balanceDate, endDate),
            sql`${reportFinanceLedger.accountType} IN ('asset', 'liability', 'equity')`,
          ),
        )
        .groupBy(
          reportFinanceLedger.accountId,
          reportFinanceLedger.accountName,
          reportFinanceLedger.accountType,
        );

      const assets = lines
        .filter((l) => l.type === 'asset')
        .reduce((sum, l) => sum + Number(l.balance), 0);

      const liabilities = lines
        .filter((l) => l.type === 'liability')
        .reduce((sum, l) => sum + Number(l.balance), 0);

      const equity = lines
        .filter((l) => l.type === 'equity')
        .reduce((sum, l) => sum + Number(l.balance), 0);

      return {
        assets,
        liabilities,
        equity,
        isBalanced: Math.abs(assets - (liabilities + equity)) < 0.01,
        details: lines.map((l) => ({
          accountName: l.accountName,
          type: l.type,
          balance: Number(l.balance),
        })),
      };
    });
  }

  /**
   * Concurrent Refresh for Reporting Materialized Views.
   * Axiom: Offloads expensive DDL operations to the database layer.
   */
  async refreshReports() {
    await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_account_daily_balances`);
  }
}

export const financeService = new FinanceService();
