import { pgTable, uuid, pgEnum, numeric, index, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { customers } from './customers.schema.js';
import { salesOrderLines } from './sales-order-lines.schema.js';
import { shipments } from './shipments.schema.js';

/**
 * Sales Order Lifecycle States
 */
export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'draft',
  'approved',
  'shipped',
  'cancelled',
]);

/**
 * Sales Orders: The root record for customer demand.
 * Axiom: High-level document tracking financial and fulfillment status.
 */
export const salesOrders = pgTable(
  'sales_orders',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

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
  shipments: many(shipments),
}));

export type SalesOrder = typeof salesOrders.$inferSelect;

/**
 * Validation Axiom: Enforce snapshot integrity for order creation.
 */
export const salesOrderSchema = z.object({
  customerId: z.uuid(),
  documentNumber: z.string().min(1, 'Document number is required'),
  status: z.enum(['draft', 'approved', 'shipped', 'cancelled']).default('draft'),
});
