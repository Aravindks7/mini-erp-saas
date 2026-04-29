import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { bills } from './bills.schema.js';

export const billLines = pgTable(
  'bill_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    billId: uuid('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
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
    index('bill_lines_org_idx').on(table.organizationId),
    index('bill_lines_bill_idx').on(table.billId),
    index('bill_lines_product_idx').on(table.productId),
    check('bill_lines_quantity_check', sql`${table.quantity} > 0`),
    check('bill_lines_price_check', sql`${table.unitPrice} >= 0`),
  ],
);

export const billLinesRelations = relations(billLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [billLines.organizationId],
    references: [organizations.id],
  }),
  bill: one(bills, {
    fields: [billLines.billId],
    references: [bills.id],
  }),
  product: one(products, {
    fields: [billLines.productId],
    references: [products.id],
  }),
}));

export type BillLine = typeof billLines.$inferSelect;
