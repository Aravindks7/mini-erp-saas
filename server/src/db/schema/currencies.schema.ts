import { pgTable, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';

/**
 * Currencies Table
 * Manages tenant-specific currency configurations.
 */
export const currencies = pgTable(
  'currencies',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...lifecycle,

    code: text('code').notNull(), // e.g., 'USD', 'INR'
    symbol: text('symbol').notNull(), // e.g., '$', '₹'
    name: text('name').notNull(), // e.g., 'US Dollar'
    isActive: boolean('is_active').default(true).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
  },
  (table) => [
    index('currencies_org_idx').on(table.organizationId),
    uniqueIndex('currencies_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

export const currenciesRelations = relations(currencies, ({ one }) => ({
  organization: one(organizations, {
    fields: [currencies.organizationId],
    references: [organizations.id],
  }),
}));

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;
