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
import { customers } from './customers.schema.js';
import { salesOrders } from './sales-orders.schema.js';
import { invoiceLines } from './invoice-lines.schema.js';

export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void']);

export const invoices = pgTable(
  'invoices',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id),
    salesOrderId: uuid('sales_order_id').references(() => salesOrders.id),
    documentNumber: text('document_number').notNull(),
    status: invoiceStatusEnum('status').default('draft').notNull(),
    issueDate: timestamp('issue_date').notNull(),
    dueDate: timestamp('due_date').notNull(),
    totalAmount: numeric('total_amount', { precision: 18, scale: 8 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 8 }).notNull(),
    notes: text('notes'),
  },
  (table) => [
    index('invoice_org_idx').on(table.organizationId),
    index('invoice_customer_idx').on(table.customerId),
    index('invoice_status_idx').on(table.status),
    uniqueIndex('invoice_org_doc_unique').on(table.organizationId, table.documentNumber),
  ],
);

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [invoices.salesOrderId],
    references: [salesOrders.id],
  }),
  lines: many(invoiceLines),
}));

export type Invoice = typeof invoices.$inferSelect;
