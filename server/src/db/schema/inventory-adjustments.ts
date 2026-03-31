import { pgTable, uuid, text, index, timestamp, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking, versioning, lifecycle } from './base.schema.js';
import { organizations, baseColumns } from './core.js';
import { products, warehouses } from './master.js';
import { bins } from './inventory.js';

/**
 * Inventory Adjustment Header: Records the "Why" and "When" of a stock correction.
 */
export const inventoryAdjustments = pgTable(
  'inventory_adjustments',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    adjustmentDate: timestamp('adjustment_date').defaultNow().notNull(),
    reason: text('reason').notNull(), // e.g., 'Damage', 'Cycle Count', 'Theft'
    reference: text('reference'), // External document or ticket ID
    status: text('status', { enum: ['draft', 'approved', 'cancelled'] })
      .default('draft')
      .notNull(),
    ...lifecycle,
  },
  (table) => [index('inv_adj_org_idx').on(table.organizationId)],
);

/**
 * Inventory Adjustment Lines: The specific product/quantity impact.
 */
export const inventoryAdjustmentLines = pgTable(
  'inventory_adjustment_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

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

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryAdjustments.organizationId],
    references: [organizations.id],
  }),
  lines: many(inventoryAdjustmentLines),
}));

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

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type InventoryAdjustmentLine = typeof inventoryAdjustmentLines.$inferSelect;
