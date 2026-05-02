import { pgTable, text, index, pgEnum, uuid, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { invoices } from './invoices.schema.js';
import { bills } from './bills.schema.js';

export const paymentIntentStatusEnum = pgEnum('payment_intent_status', [
  'pending',
  'succeeded',
  'failed',
  'expired',
]);

export const paymentIntents = pgTable(
  'payment_intents',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...lifecycle,

    invoiceId: uuid('invoice_id').references(() => invoices.id),
    billId: uuid('bill_id').references(() => bills.id),
    amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),
    currency: text('currency').default('USD').notNull(),
    status: paymentIntentStatusEnum('status').default('pending').notNull(),
    provider: text('provider').notNull(), // 'stripe'
    providerRef: text('provider_ref').notNull(), // Stripe Session ID or PI ID
    metadata: jsonb('metadata'),
  },
  (table) => [
    index('payment_intents_org_idx').on(table.organizationId),
    index('payment_intents_invoice_idx').on(table.invoiceId),
    index('payment_intents_bill_idx').on(table.billId),
  ],
);

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  organization: one(organizations, {
    fields: [paymentIntents.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [paymentIntents.invoiceId],
    references: [invoices.id],
  }),
  bill: one(bills, {
    fields: [paymentIntents.billId],
    references: [bills.id],
  }),
}));

export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type NewPaymentIntent = typeof paymentIntents.$inferInsert;
