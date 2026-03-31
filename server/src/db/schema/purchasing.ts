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
import { timestamps, userTracking, versioning } from './base.schema.js';
import { organizations, baseColumns } from './core.js';
import { suppliers, products } from './master.js';

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
    ...versioning,

    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    documentNumber: text('document_number').notNull(),
    status: purchaseOrderStatusEnum('status').default('draft').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 8 }),
  },
  (table) => [
    index('po_org_idx').on(table.organizationId),
    index('po_supplier_idx').on(table.supplierId),
    index('po_status_idx').on(table.status),
    uniqueIndex('po_org_doc_unique').on(table.organizationId, table.documentNumber),
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

/**
 * Purchase order lines with absolute numeric precision.
 * Precision: numeric(18, 8) ensures exact quantity tracking across conversions.
 */
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

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderLine = typeof purchaseOrderLines.$inferSelect;
