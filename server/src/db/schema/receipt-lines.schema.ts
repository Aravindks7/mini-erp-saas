import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { receipts } from './receipts.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';
import { purchaseOrderLines } from './purchase-order-lines.schema.js';

/**
 * Receipt Lines: Physical fulfillment details.
 * Axiom: Atomic record of quantity received at a specific location.
 */
export const receiptLines = pgTable(
  'receipt_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    receiptId: uuid('receipt_id')
      .notNull()
      .references(() => receipts.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    binId: uuid('bin_id').references(() => bins.id),
    purchaseOrderLineId: uuid('purchase_order_line_id').references(() => purchaseOrderLines.id),

    quantityReceived: numeric('quantity_received', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('receipt_lines_org_idx').on(table.organizationId),
    index('receipt_lines_receipt_idx').on(table.receiptId),
    index('receipt_lines_product_idx').on(table.productId),
    check('receipt_lines_quantity_check', sql`${table.quantityReceived} > 0`),
  ],
);

export const receiptLinesRelations = relations(receiptLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [receiptLines.organizationId],
    references: [organizations.id],
  }),
  receipt: one(receipts, {
    fields: [receiptLines.receiptId],
    references: [receipts.id],
  }),
  product: one(products, {
    fields: [receiptLines.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [receiptLines.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [receiptLines.binId],
    references: [bins.id],
  }),
  purchaseOrderLine: one(purchaseOrderLines, {
    fields: [receiptLines.purchaseOrderLineId],
    references: [purchaseOrderLines.id],
  }),
}));

export type ReceiptLine = typeof receiptLines.$inferSelect;
