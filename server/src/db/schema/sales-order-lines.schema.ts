import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { salesOrders } from './sales-orders.schema.js';
import { shipmentLines } from './shipment-lines.schema.js';
import { z } from 'zod';

/**
 * Sales Order Lines: Atomic line-item fulfillment details.
 * Precision: numeric(18, 8) ensures exact quantity tracking across conversions.
 */
export const salesOrderLines = pgTable(
  'sales_order_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    salesOrderId: uuid('sales_order_id')
      .notNull()
      .references(() => salesOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    quantity: numeric('quantity', { precision: 18, scale: 8 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 8 }).notNull(),
    taxRateAtOrder: numeric('tax_rate_at_order', { precision: 18, scale: 8 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('so_lines_org_idx').on(table.organizationId),
    index('so_lines_order_idx').on(table.salesOrderId),
    index('so_lines_product_idx').on(table.productId),
    check('so_lines_quantity_check', sql`${table.quantity} > 0`),
    check('so_lines_price_check', sql`${table.unitPrice} >= 0`),
  ],
);

export const salesOrderLinesRelations = relations(salesOrderLines, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [salesOrderLines.organizationId],
    references: [organizations.id],
  }),
  order: one(salesOrders, {
    fields: [salesOrderLines.salesOrderId],
    references: [salesOrders.id],
  }),
  product: one(products, {
    fields: [salesOrderLines.productId],
    references: [products.id],
  }),
  shipmentLines: many(shipmentLines),
}));

export type SalesOrderLine = typeof salesOrderLines.$inferSelect;

/**
 * Validation Axiom: Ensure financial precision at the line level.
 */
export const salesOrderLineSchema = z.object({
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
