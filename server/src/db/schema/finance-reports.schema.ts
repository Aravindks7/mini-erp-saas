import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations.schema.js';
import { accounts } from './accounts.schema.js';

/**
 * Finance Reporting Secure View
 * Axiom: Mapped to 'report_finance_ledger' which provides pre-aggregated, tenant-isolated daily balances.
 */
export const reportFinanceLedger = pgTable('report_finance_ledger', {
  organizationId: uuid('organization_id').notNull(),
  accountId: uuid('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(),
  accountCode: text('account_code'),
  balanceDate: timestamp('balance_date').notNull(),
  totalDebit: numeric('total_debit').notNull(),
  totalCredit: numeric('total_credit').notNull(),
  netBalance: numeric('net_balance').notNull(),
});

export const reportFinanceLedgerRelations = relations(reportFinanceLedger, ({ one }) => ({
  organization: one(organizations, {
    fields: [reportFinanceLedger.organizationId],
    references: [organizations.id],
  }),
  account: one(accounts, {
    fields: [reportFinanceLedger.accountId],
    references: [accounts.id],
  }),
}));
