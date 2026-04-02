import { pgTable, uuid, pgEnum, numeric, index, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { suppliers } from './suppliers.schema.js';
import { purchaseOrderLines } from './purchase-order-lines.schema.js';
import { z } from 'zod';

/**
 * Purchase Order Lifecycle States
 */
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'sent',
  'received',
  'cancelled',
]);

/**
 * Purchase Orders: The root record for supplier procurement.
 * Axiom: High-level document tracking commitment and intake status.
 */
export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

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

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

/**
 * Validation Axiom: Enforce snapshot integrity for order creation.
 */
export const purchaseOrderSchema = z.object({
  supplierId: z.uuid(),
  documentNumber: z.string().min(1, 'Document number is required'),
  status: z.enum(['draft', 'sent', 'received', 'cancelled']).default('draft'),
});
