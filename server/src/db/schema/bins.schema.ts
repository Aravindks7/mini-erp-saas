import { pgTable, text, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { warehouses } from './warehouses.schema.js';

/**
 * Warehouse Bins: Sub-warehouse locations (e.g., Aisle 1, Shelf B).
 * Axiom: Granular stock positioning for high-fidelity fulfillment.
 */
export const bins = pgTable(
  'bins',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    code: text('code').notNull(), // e.g., 'A1-B2-01'
    name: text('name'),
  },
  (table) => [
    index('bins_org_idx').on(table.organizationId),
    index('bins_warehouse_idx').on(table.warehouseId),
    uniqueIndex('bins_org_wh_code_unique').on(
      table.organizationId,
      table.warehouseId,
      sql`lower(${table.code})`,
    ),
  ],
);

export const binsRelations = relations(bins, ({ one }) => ({
  organization: one(organizations, {
    fields: [bins.organizationId],
    references: [organizations.id],
  }),
  warehouse: one(warehouses, {
    fields: [bins.warehouseId],
    references: [warehouses.id],
  }),
}));

export type Bin = typeof bins.$inferSelect;
