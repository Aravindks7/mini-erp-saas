import {
  pgTable,
  uuid,
  pgEnum,
  numeric,
  index,
  check,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './master.schema.js';
import { customers } from './customers.schema.js';

export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'draft',
  'approved',
  'shipped',
  'cancelled',
]);

export const salesOrders = pgTable(
  'sales_orders',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    documentNumber: text('document_number').notNull(),
    status: salesOrderStatusEnum('status').default('draft').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 8 }),
  },
  (table) => [
    index('so_org_idx').on(table.organizationId),
    index('so_customer_idx').on(table.customerId),
    index('so_status_idx').on(table.status),
    uniqueIndex('so_org_doc_unique').on(table.organizationId, table.documentNumber),
  ],
);

export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [salesOrders.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [salesOrders.customerId],
    references: [customers.id],
  }),
  lines: many(salesOrderLines),
}));

/**
 * Sales order lines with absolute numeric precision.
 * Precision: numeric(18, 8) ensures exact quantity tracking across conversions.
 */
export const salesOrderLines = pgTable(
  'sales_order_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

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

export const salesOrderLinesRelations = relations(salesOrderLines, ({ one }) => ({
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
}));

export type SalesOrder = typeof salesOrders.$inferSelect;
export type SalesOrderLine = typeof salesOrderLines.$inferSelect;

/**
 * Zod Validation Schemas
 * Strictly enforces snapshot integrity for financial data.
 */
import { z } from 'zod';

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

export const salesOrderSchema = z.object({
  customerId: z.uuid(),
  documentNumber: z.string().min(1, 'Document number is required'),
  status: z.enum(['draft', 'approved', 'shipped', 'cancelled']).default('draft'),
  lines: z.array(salesOrderLineSchema).min(1, 'Order must have at least one line'),
});
