import {
  pgTable,
  uuid,
  pgEnum,
  text,
  index,
  timestamp as pgTimestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking, versioning, lifecycle } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { salesOrders } from './sales-orders.schema.js';
import { shipmentLines } from './shipment-lines.schema.js';

/**
 * Shipment Lifecycle States
 */
export const shipmentStatusEnum = pgEnum('shipment_status', ['draft', 'shipped', 'cancelled']);

/**
 * Shipments: Record of outbound stock to a customer.
 * Axiom: The legal point of inventory possession transition.
 */
export const shipments = pgTable(
  'shipments',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    salesOrderId: uuid('sales_order_id')
      .notNull()
      .references(() => salesOrders.id),
    shipmentNumber: text('shipment_number').notNull(),
    shipmentDate: pgTimestamp('shipment_date').defaultNow().notNull(),
    reference: text('reference'), // Carrier tracking number
    status: shipmentStatusEnum('status').default('shipped').notNull(),
  },
  (table) => [
    index('shipment_org_idx').on(table.organizationId),
    index('shipment_so_idx').on(table.salesOrderId),
    uniqueIndex('shipment_org_num_unique').on(table.organizationId, table.shipmentNumber),
  ],
);

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [shipments.organizationId],
    references: [organizations.id],
  }),
  salesOrder: one(salesOrders, {
    fields: [shipments.salesOrderId],
    references: [salesOrders.id],
  }),
  lines: many(shipmentLines),
}));

export type Shipment = typeof shipments.$inferSelect;
