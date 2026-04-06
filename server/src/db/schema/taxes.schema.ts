import { pgTable, text, index, numeric, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';

export const taxes = pgTable(
  'taxes',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    name: text('name').notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    description: text('description'),
    ...lifecycle,
  },
  (table) => [
    index('taxes_org_idx').on(table.organizationId),
    check('taxes_rate_check', sql`${table.rate} >= 0`),
  ],
);

export const taxesRelations = relations(taxes, ({ one }) => ({
  organization: one(organizations, {
    fields: [taxes.organizationId],
    references: [organizations.id],
  }),
}));

export type Tax = typeof taxes.$inferSelect;
