import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';

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
    ...versioning,
    ...lifecycle,

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

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
