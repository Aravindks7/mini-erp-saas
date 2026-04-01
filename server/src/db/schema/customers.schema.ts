import { pgTable, text, index, uniqueIndex, pgEnum, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { addresses, contacts } from './common.schema.js';

// --- ENUMS ---

export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive']);

// --- TABLES ---

export const customers = pgTable(
  'customers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    companyName: text('company_name').notNull(),
    taxNumber: text('tax_number'),

    status: customerStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('customers_org_idx').on(table.organizationId),
    index('customers_status_idx').on(table.status),
  ],
);

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    addressType: text('address_type'), // e.g., 'billing', 'shipping'
  },
  (table) => [
    uniqueIndex('customer_addresses_customer_id_address_id_key').on(
      table.customerId,
      table.addressId,
    ),
  ],
);

export const customerContacts = pgTable(
  'customer_contacts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('customer_contacts_customer_id_contact_id_key').on(
      table.customerId,
      table.contactId,
    ),
  ],
);

// --- RELATIONS ---

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  addresses: many(customerAddresses),
  contacts: many(customerContacts),
}));

// --- TYPES ---

export type Customer = typeof customers.$inferSelect;
