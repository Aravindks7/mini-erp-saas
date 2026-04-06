import { pgTable, uuid, index, uniqueIndex, numeric, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';

/**
 * Inventory levels tracked per Warehouse site and Bin location.
 * Precision: numeric(18, 8) for absolute mathematical consistency with UoM conversions.
 */
export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    binId: uuid('bin_id').references(() => bins.id, { onDelete: 'set null' }),

    quantityOnHand: numeric('quantity_on_hand', { precision: 18, scale: 8 }).notNull().default('0'),
    quantityAllocated: numeric('quantity_allocated', { precision: 18, scale: 8 })
      .notNull()
      .default('0'),
    quantityReserved: numeric('quantity_reserved', { precision: 18, scale: 8 })
      .notNull()
      .default('0'),
  },
  (table) => [
    index('inv_levels_org_idx').on(table.organizationId),
    index('inv_levels_product_idx').on(table.productId),
    index('inv_levels_warehouse_idx').on(table.warehouseId),
    index('inv_levels_bin_idx').on(table.binId),
    uniqueIndex('inv_levels_org_prod_wh_bin_unique').on(
      table.organizationId,
      table.productId,
      table.warehouseId,
      table.binId,
    ),
    check('inv_levels_on_hand_check', sql`${table.quantityOnHand} >= 0`),
    check('inv_levels_allocated_check', sql`${table.quantityAllocated} >= 0`),
    check('inv_levels_reserved_check', sql`${table.quantityReserved} >= 0`),
  ],
);

export const inventoryLevelsRelations = relations(inventoryLevels, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryLevels.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [inventoryLevels.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryLevels.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [inventoryLevels.binId],
    references: [bins.id],
  }),
}));

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
