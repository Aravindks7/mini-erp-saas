import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { purchaseOrders } from './purchase-orders.schema.js';
import { z } from 'zod';

/**
 * Purchase Order Lines: Atomic procurement fulfillment details.
 * Precision: numeric(18, 8) ensures exact quantity tracking across conversions.
 */
export const purchaseOrderLines = pgTable(
  'purchase_order_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    quantity: numeric('quantity', { precision: 18, scale: 8 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 8 }).notNull(),
    taxRateAtOrder: numeric('tax_rate_at_order', { precision: 18, scale: 8 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('po_lines_org_idx').on(table.organizationId),
    index('po_lines_order_idx').on(table.purchaseOrderId),
    index('po_lines_product_idx').on(table.productId),
    check('po_lines_quantity_check', sql`${table.quantity} > 0`),
    check('po_lines_price_check', sql`${table.unitPrice} >= 0`),
  ],
);

export const purchaseOrderLinesRelations = relations(purchaseOrderLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [purchaseOrderLines.organizationId],
    references: [organizations.id],
  }),
  order: one(purchaseOrders, {
    fields: [purchaseOrderLines.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  product: one(products, {
    fields: [purchaseOrderLines.productId],
    references: [products.id],
  }),
}));

export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;

/**
 * Validation Axiom: Ensure financial precision at the line level.
 */
export const purchaseOrderLineSchema = z.object({
  productId: z.uuid(),
  quantity: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v > 0, 'Quantity must be positive'),
  unitPrice: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v >= 0, 'Price cannot be negative'),
  taxRateAtOrder: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v >= 0, 'Tax rate cannot be negative'),
  taxAmount: z
    .string()
    .transform((v) => Number(v))
    .refine((v) => v >= 0, 'Tax amount cannot be negative'),
});
