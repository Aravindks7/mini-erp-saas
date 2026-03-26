import { pgTable, integer, uuid, text, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema';
import { organizations, baseColumns } from './core';
import { products } from './master';

export const inventoryReferenceTypeEnum = pgEnum('inventory_reference_type', [
  'po_receipt',
  'so_shipment',
  'adjustment',
  'transfer',
  'stock_count',
]);

export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantityOnHand: integer('quantity_on_hand').notNull().default(0),
    quantityAllocated: integer('quantity_allocated').notNull().default(0),
  },
  (table) => [
    index('inventory_levels_org_idx').on(table.organizationId),
    index('inventory_levels_product_idx').on(table.productId),
    uniqueIndex('inventory_levels_org_product_unique').on(table.organizationId, table.productId),
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
}));

export const inventoryLedgers = pgTable(
  'inventory_ledgers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantityChange: integer('quantity_change').notNull(),
    referenceType: inventoryReferenceTypeEnum('reference_type').notNull(),
    referenceId: uuid('reference_id'), // Link back to PO or SO lines
  },
  (table) => [
    index('inventory_ledgers_org_idx').on(table.organizationId),
    index('inventory_ledgers_product_idx').on(table.productId),
    index('inventory_ledgers_ref_idx').on(table.referenceType, table.referenceId),
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
}));

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;

export type InventoryLedger = typeof inventoryLedgers.$inferSelect;
export type NewInventoryLedger = typeof inventoryLedgers.$inferInsert;
