import { pgTable, text, boolean, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, lifecycle } from './audit.schema.js';
import { journalEntryLines } from './journal-entry-lines.schema.js';

export const accountTypeEnum = pgEnum('account_type', [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]);

export const accounts = pgTable('accounts', {
  ...baseColumns,
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: accountTypeEnum('type').notNull(),
  subtype: text('subtype'),
  description: text('description'),
  parentId: uuid('parent_id'),
  isActive: boolean('is_active').default(true).notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  ...timestamps,
  ...userTracking,
  ...lifecycle,
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: 'account_hierarchy',
  }),
  children: many(accounts, {
    relationName: 'account_hierarchy',
  }),
  journalLines: many(journalEntryLines),
}));

export type FinanceAccount = typeof accounts.$inferSelect;
export type NewFinanceAccount = typeof accounts.$inferInsert;
