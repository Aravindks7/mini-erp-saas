import { pgTable, text, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { customerAddresses } from './customer-addresses.schema.js';
import { customerContacts } from './customer-contacts.schema.js';

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
