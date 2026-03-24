import { pgTable, integer, uuid, pgEnum, numeric, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema';
import { organizations, baseColumns } from './core';
import { suppliers, products } from './master';

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'sent',
  'received',
  'cancelled',
]);

export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    status: purchaseOrderStatusEnum('status').default('draft').notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }),
  },
  (table) => [
    index('po_org_idx').on(table.organizationId),
    index('po_supplier_idx').on(table.supplierId),
    index('po_status_idx').on(table.status),
  ],
);

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
  lines: many(purchaseOrderLines),
}));

export const purchaseOrderLines = pgTable(
  'purchase_order_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    index('po_lines_org_idx').on(table.organizationId),
    index('po_lines_order_idx').on(table.purchaseOrderId),
    index('po_lines_product_idx').on(table.productId),
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
