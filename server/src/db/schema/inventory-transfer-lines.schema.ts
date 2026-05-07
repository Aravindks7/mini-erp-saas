import { pgTable, uuid, index, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { inventoryTransfers } from './inventory-transfers.schema.js';
import { products } from './products.schema.js';

/**
 * Inventory Transfer Lines: Detail of items being moved.
 */
export const inventoryTransferLines = pgTable(
  'inventory_transfer_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    transferId: uuid('transfer_id')
      .notNull()
      .references(() => inventoryTransfers.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: numeric('quantity', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('inv_transfer_lines_org_idx').on(table.organizationId),
    index('inv_transfer_lines_transfer_idx').on(table.transferId),
  ],
);

export const inventoryTransferLinesRelations = relations(inventoryTransferLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryTransferLines.organizationId],
    references: [organizations.id],
  }),
  transfer: one(inventoryTransfers, {
    fields: [inventoryTransferLines.transferId],
    references: [inventoryTransfers.id],
  }),
  product: one(products, {
    fields: [inventoryTransferLines.productId],
    references: [products.id],
  }),
}));

export type InventoryTransferLine = typeof inventoryTransferLines.$inferSelect;
