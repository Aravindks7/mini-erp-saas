import { pgTable, text, uuid, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { journalEntries } from './journal-entries.schema.js';
import { accounts } from './accounts.schema.js';

export const journalEntryLines = pgTable('journal_entry_lines', {
  ...baseColumns,
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'restrict' }),
  debit: numeric('debit', { precision: 15, scale: 2 }).default('0').notNull(),
  credit: numeric('credit', { precision: 15, scale: 2 }).default('0').notNull(),
  description: text('description'),
});

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalEntryLines.accountId],
    references: [accounts.id],
  }),
}));

export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type NewJournalEntryLine = typeof journalEntryLines.$inferInsert;
