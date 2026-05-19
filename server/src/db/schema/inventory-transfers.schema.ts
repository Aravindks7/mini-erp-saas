import { pgTable, text, index, timestamp as pgTimestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { warehouses } from './warehouses.schema.js';
import { inventoryTransferLines } from './inventory-transfer-lines.schema.js';

/**
 * Inventory Transfer Header: Tracks movement between warehouses.
 * Axiom: Stock exists in 'Transit' between SHIPPED and RECEIVED states.
 */
export const inventoryTransfers = pgTable(
  'inventory_transfers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    transferDate: pgTimestamp('transfer_date').defaultNow().notNull(),
    fromWarehouseId: uuid('from_warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    toWarehouseId: uuid('to_warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    reference: text('reference'),
    status: text('status', { enum: ['draft', 'shipped', 'received', 'cancelled'] })
      .default('draft')
      .notNull(),
  },
  (table) => [index('inv_transfer_org_idx').on(table.organizationId)],
);

export const inventoryTransfersRelations = relations(inventoryTransfers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryTransfers.organizationId],
    references: [organizations.id],
  }),
  fromWarehouse: one(warehouses, {
    fields: [inventoryTransfers.fromWarehouseId],
    references: [warehouses.id],
  }),
  toWarehouse: one(warehouses, {
    fields: [inventoryTransfers.toWarehouseId],
    references: [warehouses.id],
  }),
  lines: many(inventoryTransferLines),
}));

export type InventoryTransfer = typeof inventoryTransfers.$inferSelect;
