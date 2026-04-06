import { pgTable, uuid, numeric, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { products } from './products.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';
import { inventoryAdjustments } from './inventory-adjustments.schema.js';

/**
 * Inventory Adjustment Lines: The specific product/quantity impact.
 * Axiom: Line-level traceability for inventory reconciliation.
 */
export const inventoryAdjustmentLines = pgTable(
  'inventory_adjustment_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    adjustmentId: uuid('adjustment_id')
      .notNull()
      .references(() => inventoryAdjustments.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    binId: uuid('bin_id').references(() => bins.id),

    quantityChange: numeric('quantity_change', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('inv_adj_line_org_idx').on(table.organizationId),
    index('inv_adj_line_adj_idx').on(table.adjustmentId),
  ],
);

export const inventoryAdjustmentLinesRelations = relations(inventoryAdjustmentLines, ({ one }) => ({
  adjustment: one(inventoryAdjustments, {
    fields: [inventoryAdjustmentLines.adjustmentId],
    references: [inventoryAdjustments.id],
  }),
  product: one(products, {
    fields: [inventoryAdjustmentLines.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryAdjustmentLines.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [inventoryAdjustmentLines.binId],
    references: [bins.id],
  }),
}));

export type InventoryAdjustmentLine = typeof inventoryAdjustmentLines.$inferSelect;
