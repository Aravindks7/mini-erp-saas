import {
  pgTable,
  uuid,
  pgEnum,
  text,
  index,
  timestamp as pgTimestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { purchaseOrders } from './purchase-orders.schema.js';
import { receiptLines } from './receipt-lines.schema.js';

/**
 * Receipt Lifecycle States
 */
export const receiptStatusEnum = pgEnum('receipt_status', ['draft', 'received', 'cancelled']);

/**
 * Receipts: Record of inbound stock from a supplier.
 * Axiom: The legal point of inventory possession transition.
 */
export const receipts = pgTable(
  'receipts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    receiptNumber: text('receipt_number').notNull(),
    receivedDate: pgTimestamp('received_date').defaultNow().notNull(),
    reference: text('reference'), // Supplier packing slip number
    status: receiptStatusEnum('status').default('received').notNull(),
  },
  (table) => [
    index('receipt_org_idx').on(table.organizationId),
    index('receipt_po_idx').on(table.purchaseOrderId),
    uniqueIndex('receipt_org_num_unique').on(table.organizationId, table.receiptNumber),
  ],
);

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [receipts.organizationId],
    references: [organizations.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [receipts.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  lines: many(receiptLines),
}));

export type Receipt = typeof receipts.$inferSelect;
