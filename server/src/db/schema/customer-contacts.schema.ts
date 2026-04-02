import { pgTable, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { contacts } from './contacts.schema.js';
import { customers } from './customers.schema.js';

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
    uniqueIndex('idx_customer_contacts_primary_unique')
      .on(table.customerId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerContacts.customerId],
    references: [customers.id],
  }),
  contact: one(contacts, {
    fields: [customerContacts.contactId],
    references: [contacts.id],
  }),
}));
