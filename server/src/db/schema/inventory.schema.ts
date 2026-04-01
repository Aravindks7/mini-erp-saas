import {
  pgTable,
  uuid,
  text,
  index,
  uniqueIndex,
  pgEnum,
  numeric,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products, warehouses } from './master.schema.js';

export const inventoryReferenceTypeEnum = pgEnum('inventory_reference_type', [
  'po_receipt',
  'so_shipment',
  'adjustment',
  'transfer',
  'stock_count',
]);

/**
 * Warehouse Bins: Sub-warehouse locations (e.g., Aisle 1, Shelf B).
 */
export const bins = pgTable(
  'bins',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    code: text('code').notNull(), // e.g., 'A1-B2-01'
    name: text('name'),
    ...lifecycle,
  },
  (table) => [
    index('bins_org_idx').on(table.organizationId),
    index('bins_warehouse_idx').on(table.warehouseId),
    uniqueIndex('bins_org_wh_code_unique').on(
      table.organizationId,
      table.warehouseId,
      sql`lower(${table.code})`,
    ),
  ],
);

export const binsRelations = relations(bins, ({ one }) => ({
  organization: one(organizations, {
    fields: [bins.organizationId],
    references: [organizations.id],
  }),
  warehouse: one(warehouses, {
    fields: [bins.warehouseId],
    references: [warehouses.id],
  }),
}));

/**
 * Inventory levels tracked per Warehouse site and Bin location.
 * Precision: numeric(18, 8) for absolute mathematical consistency with UoM conversions.
 */
export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    binId: uuid('bin_id').references(() => bins.id, { onDelete: 'set null' }),

    quantityOnHand: numeric('quantity_on_hand', { precision: 18, scale: 8 }).notNull().default('0'),
    quantityAllocated: numeric('quantity_allocated', { precision: 18, scale: 8 })
      .notNull()
      .default('0'),
    quantityReserved: numeric('quantity_reserved', { precision: 18, scale: 8 })
      .notNull()
      .default('0'),
  },
  (table) => [
    index('inv_levels_org_idx').on(table.organizationId),
    index('inv_levels_product_idx').on(table.productId),
    index('inv_levels_warehouse_idx').on(table.warehouseId),
    index('inv_levels_bin_idx').on(table.binId),
    uniqueIndex('inv_levels_org_prod_wh_bin_unique').on(
      table.organizationId,
      table.productId,
      table.warehouseId,
      table.binId,
    ),
    check('inv_levels_on_hand_check', sql`${table.quantityOnHand} >= 0`),
    check('inv_levels_allocated_check', sql`${table.quantityAllocated} >= 0`),
    check('inv_levels_reserved_check', sql`${table.quantityReserved} >= 0`),
  ],
);

export const inventoryLevelsRelations = relations(inventoryLevels, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryLevels.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [inventoryLevels.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryLevels.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [inventoryLevels.binId],
    references: [bins.id],
  }),
}));

/**
 * Audit trail for all stock movements.
 */
export const inventoryLedgers = pgTable(
  'inventory_ledgers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    binId: uuid('bin_id').references(() => bins.id),

    quantityChange: numeric('quantity_change', { precision: 18, scale: 8 }).notNull(),
    referenceType: inventoryReferenceTypeEnum('reference_type').notNull(),
    referenceId: uuid('reference_id'), // Link back to PO, SO, or Adjustment lines
  },
  (table) => [
    index('inv_ledger_org_idx').on(table.organizationId),
    index('inv_ledger_product_idx').on(table.productId),
    index('inv_ledger_warehouse_idx').on(table.warehouseId),
    index('inv_ledger_bin_idx').on(table.binId),
    index('inv_ledger_ref_idx').on(table.referenceType, table.referenceId),
  ],
);

export const inventoryLedgersRelations = relations(inventoryLedgers, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryLedgers.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [inventoryLedgers.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryLedgers.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [inventoryLedgers.binId],
    references: [bins.id],
  }),
}));

export type Bin = typeof bins.$inferSelect;
export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type InventoryLedger = typeof inventoryLedgers.$inferSelect;
