import { pgTable, uuid, numeric, index, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { products } from './products.schema.js';
import { shipments } from './shipments.schema.js';
import { warehouses } from './warehouses.schema.js';
import { bins } from './bins.schema.js';
import { salesOrderLines } from './sales-order-lines.schema.js';

/**
 * Shipment Lines: Physical fulfillment details.
 * Axiom: Atomic record of quantity shipped from a specific location.
 */
export const shipmentLines = pgTable(
  'shipment_lines',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => shipments.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id),
    binId: uuid('bin_id').references(() => bins.id),
    salesOrderLineId: uuid('sales_order_line_id').references(() => salesOrderLines.id),

    quantityShipped: numeric('quantity_shipped', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('shipment_lines_org_idx').on(table.organizationId),
    index('shipment_lines_shipment_idx').on(table.shipmentId),
    index('shipment_lines_product_idx').on(table.productId),
    check('shipment_lines_quantity_check', sql`${table.quantityShipped} > 0`),
  ],
);

export const shipmentLinesRelations = relations(shipmentLines, ({ one }) => ({
  organization: one(organizations, {
    fields: [shipmentLines.organizationId],
    references: [organizations.id],
  }),
  shipment: one(shipments, {
    fields: [shipmentLines.shipmentId],
    references: [shipments.id],
  }),
  product: one(products, {
    fields: [shipmentLines.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [shipmentLines.warehouseId],
    references: [warehouses.id],
  }),
  bin: one(bins, {
    fields: [shipmentLines.binId],
    references: [bins.id],
  }),
  salesOrderLine: one(salesOrderLines, {
    fields: [shipmentLines.salesOrderLineId],
    references: [salesOrderLines.id],
  }),
}));

export type ShipmentLine = typeof shipmentLines.$inferSelect;
