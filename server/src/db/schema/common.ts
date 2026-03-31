import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { timestamps, userTracking } from './base.schema.js';
import { baseColumns } from './core.js';

/**
 * Single Source of Truth for all Address data.
 * Axiom: Normalized address repository to prevent concrete duplication.
 */
export const addresses = pgTable(
  'addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    name: text('name'), // e.g., 'Headquarters', 'Warehouse A'
    addressLine1: text('address_line1').notNull(),
    addressLine2: text('address_line2'),
    city: text('city').notNull(),
    state: text('state'),
    postalCode: text('postal_code'),
    country: text('country').notNull(),
  },
  (table) => [index('addresses_org_idx').on(table.organizationId)],
);

/**
 * Central repository for Person-level data.
 * Supports multi-contact management across customers and suppliers.
 */
export const contacts = pgTable(
  'contacts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    jobTitle: text('job_title'),
  },
  (table) => [index('contacts_org_idx').on(table.organizationId)],
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
