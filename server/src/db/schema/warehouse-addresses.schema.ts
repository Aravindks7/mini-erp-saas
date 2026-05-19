import { pgTable, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { addresses } from './addresses.schema.js';
import { warehouses } from './warehouses.schema.js';

export const warehouseAddresses = pgTable(
  'warehouse_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('warehouse_addresses_warehouse_id_address_id_key').on(
      table.warehouseId,
      table.addressId,
    ),
    // Senior Staff Hardening: Prevent "Double Primary" race conditions
    uniqueIndex('idx_warehouse_addresses_primary_unique')
      .on(table.warehouseId)
      .where(sql`${table.isPrimary} = true`),
  ],
);

export const warehouseAddressesRelations = relations(warehouseAddresses, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseAddresses.warehouseId],
    references: [warehouses.id],
  }),
  address: one(addresses, {
    fields: [warehouseAddresses.addressId],
    references: [addresses.id],
  }),
}));
