import { pgTable, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { contacts } from './contacts.schema.js';
import { suppliers } from './suppliers.schema.js';

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
