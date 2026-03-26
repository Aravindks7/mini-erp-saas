import { pgTable, text, timestamp, index, uniqueIndex, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema.js';
import { organizations, baseColumns } from './core.js';

export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive']);

export const customers = pgTable(
  'customers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    firstName: text('first_name'),
    lastName: text('last_name'),
    companyName: text('company_name'),
    email: text('email'),
    phone: text('phone'),

    status: customerStatusEnum('status').default('active').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('customers_org_idx').on(table.organizationId),
    index('customers_status_idx').on(table.status),
    uniqueIndex('customers_org_email_unique')
      .on(table.organizationId, table.email)
      .where(sql`${table.email} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  ],
);

export const customersRelations = relations(customers, ({ one }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
}));

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);

export const products = pgTable(
  'products',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),

    status: productStatusEnum('status').default('active').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('products_org_idx').on(table.organizationId),
    index('products_name_idx').on(table.name),
    uniqueIndex('products_org_sku_unique')
      .on(table.organizationId, table.sku)
      .where(sql`${table.sku} IS NOT NULL AND ${table.deletedAt} IS NULL`),
  ],
);

export const productsRelations = relations(products, ({ one }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
}));

export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive']);

export const suppliers = pgTable(
  'suppliers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    name: text('name').notNull(),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),

    status: supplierStatusEnum('status').default('active').notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('suppliers_org_idx').on(table.organizationId),
    index('suppliers_name_idx').on(table.name),
  ],
);

export const suppliersRelations = relations(suppliers, ({ one }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
}));

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
