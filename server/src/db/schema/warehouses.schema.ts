import { pgTable, text, index, uniqueIndex, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { addresses } from './addresses.schema.js';

export const warehouses = pgTable(
  'warehouses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    code: text('code').notNull(),
    name: text('name').notNull(),
    ...lifecycle,
  },
  (table) => [
    index('warehouses_org_idx').on(table.organizationId),
    uniqueIndex('warehouses_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

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

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  addresses: many(warehouseAddresses),
}));

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

export type Warehouse = typeof warehouses.$inferSelect;
