import { pgTable, text, index, uniqueIndex, pgEnum, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { addresses } from './addresses.schema.js';
import { contacts } from './contacts.schema.js';

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
  ],
);

export const supplierAddresses = pgTable(
  'supplier_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    addressType: text('address_type'),
  },
  (table) => [
    uniqueIndex('supplier_addresses_supplier_id_address_id_key').on(
      table.supplierId,
      table.addressId,
    ),
    // Senior Staff Hardening: Prevent "Double Primary" race conditions
    uniqueIndex('idx_supplier_addresses_primary_unique')
      .on(table.supplierId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const supplierContacts = pgTable(
  'supplier_contacts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('supplier_contacts_supplier_id_contact_id_key').on(
      table.supplierId,
      table.contactId,
    ),
    // Senior Staff Hardening: Prevent "Double Primary" race conditions
    uniqueIndex('idx_supplier_contacts_primary_unique')
      .on(table.supplierId)
      .where(sql`${table.isPrimary} = true`),
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

export const supplierAddressesRelations = relations(supplierAddresses, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierAddresses.supplierId],
    references: [suppliers.id],
  }),
  address: one(addresses, {
    fields: [supplierAddresses.addressId],
    references: [addresses.id],
  }),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
  contact: one(contacts, {
    fields: [supplierContacts.contactId],
    references: [contacts.id],
  }),
}));

export type Supplier = typeof suppliers.$inferSelect;
