import { pgTable, text, index, timestamp as pgTimestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { inventoryAdjustmentLines } from './inventory-adjustment-lines.schema.js';

/**
 * Inventory Adjustment Header: Records the "Why" and "When" of a stock correction.
 * Axiom: High-level document tracking the intent of inventory variance.
 */
export const inventoryAdjustments = pgTable(
  'inventory_adjustments',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    adjustmentDate: pgTimestamp('adjustment_date').defaultNow().notNull(),
    reason: text('reason').notNull(), // e.g., 'Damage', 'Cycle Count', 'Theft'
    reference: text('reference'), // External document or ticket ID
    status: text('status', { enum: ['draft', 'approved', 'cancelled'] })
      .default('draft')
      .notNull(),
  },
  (table) => [index('inv_adj_org_idx').on(table.organizationId)],
);

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryAdjustments.organizationId],
    references: [organizations.id],
  }),
  lines: many(inventoryAdjustmentLines),
}));

export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
