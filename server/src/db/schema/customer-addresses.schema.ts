import { pgTable, text, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { addresses } from './addresses.schema.js';
import { customers } from './customers.schema.js';

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
    uniqueIndex('idx_customer_addresses_primary_unique')
      .on(table.customerId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
  address: one(addresses, {
    fields: [customerAddresses.addressId],
    references: [addresses.id],
  }),
}));
