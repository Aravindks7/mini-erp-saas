import { pgTable, uniqueIndex, uuid, boolean, text } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { addresses } from './addresses.schema.js';
import { suppliers } from './suppliers.schema.js';

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
