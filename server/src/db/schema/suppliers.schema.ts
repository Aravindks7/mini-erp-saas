import { pgTable, text, index, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { supplierAddresses } from './supplier-addresses.schema.js';
import { supplierContacts } from './supplier-contacts.schema.js';

export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive']);

export const suppliers = pgTable(
  'suppliers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    name: text('name').notNull(),
    taxNumber: text('tax_number'),

    status: supplierStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('suppliers_org_idx').on(table.organizationId),
    index('suppliers_name_idx').on(table.name),
    uniqueIndex('suppliers_org_name_unique')
      .on(table.organizationId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  addresses: many(supplierAddresses),
  contacts: many(supplierContacts),
}));

export type Supplier = typeof suppliers.$inferSelect;
