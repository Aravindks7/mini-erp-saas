import { pgTable, integer, uuid, pgEnum, numeric, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema.js';
import { organizations, baseColumns } from './core.js';
import { customers, products } from './master.js';

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

    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    status: salesOrderStatusEnum('status').default('draft').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  },
  (table) => [
    index('so_org_idx').on(table.organizationId),
    index('so_customer_idx').on(table.customerId),
    index('so_status_idx').on(table.status),
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
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index('so_lines_org_idx').on(table.organizationId),
    index('so_lines_order_idx').on(table.salesOrderId),
    index('so_lines_product_idx').on(table.productId),
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
export type NewSalesOrder = typeof salesOrders.$inferInsert;

export type SalesOrderLine = typeof salesOrderLines.$inferSelect;
export type NewSalesOrderLine = typeof salesOrderLines.$inferInsert;
