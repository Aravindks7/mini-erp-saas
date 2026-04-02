import { pgTable, text, index } from 'drizzle-orm/pg-core';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';

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
    ...versioning,
    ...lifecycle,

    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email'),
    phone: text('phone'),
    jobTitle: text('job_title'),
  },
  (table) => [index('contacts_org_idx').on(table.organizationId)],
);

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
