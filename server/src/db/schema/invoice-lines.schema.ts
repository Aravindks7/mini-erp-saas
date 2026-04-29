import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { invoices } from './invoices.schema.js';

export const invoiceLines = pgTable(
  'invoice_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),

    quantity: numeric('quantity', { precision: 18, scale: 8 }).notNull(),
    unitPrice: numeric('unit_price', { precision: 18, scale: 8 }).notNull(),
    taxRateAtOrder: numeric('tax_rate_at_order', { precision: 18, scale: 8 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 18, scale: 8 }).notNull(),
    lineTotal: numeric('line_total', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('invoice_lines_org_idx').on(table.organizationId),
    index('invoice_lines_invoice_idx').on(table.invoiceId),
    index('invoice_lines_product_idx').on(table.productId),
    check('invoice_lines_quantity_check', sql`${table.quantity} > 0`),
    check('invoice_lines_price_check', sql`${table.unitPrice} >= 0`),
  ],
);

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceLines.organizationId],
    references: [organizations.id],
  }),
  invoice: one(invoices, {
    fields: [invoiceLines.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceLines.productId],
    references: [products.id],
  }),
}));

export type InvoiceLine = typeof invoiceLines.$inferSelect;
