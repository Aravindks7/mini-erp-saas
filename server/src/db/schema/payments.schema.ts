import { pgTable, text, index, pgEnum, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { customers } from './customers.schema.js';
import { suppliers } from './suppliers.schema.js';
import { invoices } from './invoices.schema.js';
import { bills } from './bills.schema.js';

export const paymentTypeEnum = pgEnum('payment_type', ['inbound', 'outbound']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'check',
  'credit_card',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const payments = pgTable(
  'payments',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...lifecycle,

    paymentType: paymentTypeEnum('payment_type').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    status: paymentStatusEnum('status').default('completed').notNull(),

    amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    referenceNumber: text('reference_number'),
    notes: text('notes'),

    // Target references
    customerId: uuid('customer_id').references(() => customers.id),
    supplierId: uuid('supplier_id').references(() => suppliers.id),
    invoiceId: uuid('invoice_id').references(() => invoices.id),
    billId: uuid('bill_id').references(() => bills.id),
  },
  (table) => [
    index('payments_org_idx').on(table.organizationId),
    index('payments_customer_idx').on(table.customerId),
    index('payments_supplier_idx').on(table.supplierId),
    index('payments_invoice_idx').on(table.invoiceId),
    index('payments_bill_idx').on(table.billId),
  ],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  supplier: one(suppliers, {
    fields: [payments.supplierId],
    references: [suppliers.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
}));

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
