import { pgTable, text, index, uniqueIndex, boolean } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { warehouseAddresses } from './warehouse-addresses.schema.js';
import { bins } from './bins.schema.js';

export const warehouses = pgTable(
  'warehouses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    code: text('code').notNull(),
    name: text('name').notNull(),
    isSystemTransit: boolean('is_system_transit').default(false).notNull(),
    ...lifecycle,
  },
  (table) => [
    index('warehouses_org_idx').on(table.organizationId),
    uniqueIndex('warehouses_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

export const warehousesRelations = relations(warehouses, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  addresses: many(warehouseAddresses),
  bins: many(bins),
}));

export type Warehouse = typeof warehouses.$inferSelect;
