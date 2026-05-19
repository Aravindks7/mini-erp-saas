import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, lifecycle } from './audit.schema.js';
import { journalEntryLines } from './journal-entry-lines.schema.js';

export const journalEntryStatusEnum = pgEnum('journal_entry_status', ['draft', 'posted', 'void']);

export const journalEntries = pgTable('journal_entries', {
  ...baseColumns,
  date: timestamp('date').notNull(),
  reference: text('reference'),
  description: text('description'),
  status: journalEntryStatusEnum('status').default('posted').notNull(),
  ...timestamps,
  ...userTracking,
  ...lifecycle,
});

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalEntryLines),
}));

export type JournalEntry = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;
