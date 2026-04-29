import {
  pgTable,
  uuid,
  pgEnum,
  numeric,
  index,
  text,
  uniqueIndex,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { suppliers } from './suppliers.schema.js';
import { receipts } from './receipts.schema.js';
import { purchaseOrders } from './purchase-orders.schema.js';
import { billLines } from './bill-lines.schema.js';

export const billStatusEnum = pgEnum('bill_status', ['draft', 'open', 'paid', 'void']);

export const bills = pgTable(
  'bills',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id),
    receiptId: uuid('receipt_id').references(() => receipts.id),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
    documentNumber: text('document_number').notNull(),
    referenceNumber: text('reference_number').notNull(), // Vendor's invoice number
    status: billStatusEnum('status').default('draft').notNull(),
    issueDate: timestamp('issue_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 8 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 8 }).notNull(),
    notes: text('notes'),
  },
  (table) => [
    index('bill_org_idx').on(table.organizationId),
    index('bill_supplier_idx').on(table.supplierId),
    index('bill_status_idx').on(table.status),
    uniqueIndex('bill_org_doc_unique').on(table.organizationId, table.documentNumber),
  ],
);

export const billsRelations = relations(bills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bills.organizationId],
    references: [organizations.id],
  }),
  supplier: one(suppliers, {
    fields: [bills.supplierId],
    references: [suppliers.id],
  }),
  receipt: one(receipts, {
    fields: [bills.receiptId],
    references: [receipts.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [bills.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  lines: many(billLines),
}));

export type Bill = typeof bills.$inferSelect;
