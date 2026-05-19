import { pgTable, uuid, numeric, index, check, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { salesOrderLines } from './sales-order-lines.schema.js';
import { products } from './products.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';

/**
 * Inventory Allocations: Decoupled soft-allocations linking a location-agnostic
 * Sales Order Line to a physical Warehouse and Bin.
 */
export const inventoryAllocations = pgTable(
  'inventory_allocations',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    salesOrderLineId: uuid('sales_order_line_id')
      .notNull()
      .references(() => salesOrderLines.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    binId: uuid('bin_id').references(() => bins.id),

    quantityAllocated: numeric('quantity_allocated', { precision: 18, scale: 8 })
      .notNull()
      .default('0'),
  },
  (table) => [
    index('inv_alloc_org_idx').on(table.organizationId),
    index('inv_alloc_so_line_idx').on(table.salesOrderLineId),
    index('inv_alloc_product_idx').on(table.productId),
    index('inv_alloc_warehouse_idx').on(table.warehouseId),
    uniqueIndex('inv_alloc_org_so_line_wh_bin_unique').on(
      table.organizationId,
      table.salesOrderLineId,
      table.warehouseId,
      table.binId,
    ),
    check('inv_alloc_quantity_check', sql`${table.quantityAllocated} >= 0`),
  ],
);

export const inventoryAllocationsRelations = relations(inventoryAllocations, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryAllocations.organizationId],
    references: [organizations.id],
  }),
  salesOrderLine: one(salesOrderLines, {
    fields: [inventoryAllocations.salesOrderLineId],
    references: [salesOrderLines.id],
  }),
  product: one(products, {
    fields: [inventoryAllocations.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryAllocations.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [inventoryAllocations.binId],
    references: [bins.id],
  }),
}));

export type InventoryAllocation = typeof inventoryAllocations.$inferSelect;
export type NewInventoryAllocation = typeof inventoryAllocations.$inferInsert;
