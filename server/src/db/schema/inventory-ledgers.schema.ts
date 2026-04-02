import { pgTable, uuid, index, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';

/**
 * Inventory Reference Taxonomy
 */
export const inventoryReferenceTypeEnum = pgEnum('inventory_reference_type', [
  'po_receipt',
  'so_shipment',
  'adjustment',
  'transfer',
  'stock_count',
]);

/**
 * Audit trail for all stock movements.
 * Axiom: Every quantity change must have a corresponding ledger entry for reconciliation.
 */
export const inventoryLedgers = pgTable(
  'inventory_ledgers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

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

export type InventoryLedger = typeof inventoryLedgers.$inferSelect;
