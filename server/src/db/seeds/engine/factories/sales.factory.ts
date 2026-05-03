import { db } from '../../../index.js';
import {
  salesOrders,
  salesOrderLines,
  shipments,
  shipmentLines,
  inventoryLevels,
  inventoryLedgers,
} from '../../../schema/index.js';
import { generateDeterministicId } from '../utils.js';
import { SEED_DATA } from '../../constants.js';
import { sql } from 'drizzle-orm';

export async function createSalesOrder(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  customerId: string;
  userId: string;
  productId: string;
  status: 'draft' | 'approved' | 'partially_shipped' | 'shipped' | 'cancelled';
  createdAt: Date;
  quantity: string;
  unitPrice: string;
}) {
  const docNum = `SO-2026-${String(config.index).padStart(4, '0')}`;
  const soId = generateDeterministicId(config.organizationId, docNum);

  await db
    .insert(salesOrders)
    .values({
      id: soId,
      organizationId: config.organizationId,
      customerId: config.customerId,
      documentNumber: docNum,
      status: config.status,
      totalAmount: (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2),
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [salesOrders.organizationId, salesOrders.documentNumber],
      set: {
        status: config.status,
        totalAmount: (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2),
        updatedAt: config.createdAt,
      },
    });

  const existing = await db.query.salesOrders.findFirst({
    where: (so, { and, eq }) =>
      and(eq(so.organizationId, config.organizationId), eq(so.documentNumber, docNum)),
  });
  const finalSoId = existing!.id;

  const soLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(salesOrderLines)
    .values({
      id: soLineId,
      organizationId: config.organizationId,
      salesOrderId: finalSoId,
      productId: config.productId,
      quantity: config.quantity,
      unitPrice: config.unitPrice,
      taxRateAtOrder: '0.00',
      taxAmount: '0.00',
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  /**
   * ALLOCATION LOGIC:
   * When an order is approved (or partially/fully shipped), we must allocate stock.
   * This ensures the 'Available' quantity on the dashboard reflects commitments.
   */
  const isActive = ['approved', 'partially_shipped', 'shipped'].includes(config.status);
  if (isActive) {
    await db
      .insert(inventoryLevels)
      .values({
        organizationId: config.organizationId,
        productId: config.productId,
        warehouseId: SEED_DATA.WAREHOUSES.MAIN,
        binId: SEED_DATA.BINS.MAIN_A1,
        quantityAllocated: config.quantity,
        createdAt: config.createdAt,
        updatedAt: config.createdAt,
        createdBy: config.userId,
        updatedBy: config.userId,
      })
      .onConflictDoUpdate({
        target: [
          inventoryLevels.organizationId,
          inventoryLevels.productId,
          inventoryLevels.warehouseId,
          inventoryLevels.binId,
        ],
        set: {
          quantityAllocated: sql`GREATEST(0, ${inventoryLevels.quantityAllocated} + ${config.quantity}::numeric)`,
          updatedAt: config.createdAt,
          updatedBy: config.userId,
        },
      });
  }

  return finalSoId;
}

export async function createShipment(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  soId: string;
  productId: string;
  userId: string;
  createdAt: Date;
  type: 'full' | 'partial';
  status: 'draft' | 'shipped' | 'cancelled';
  originalQuantity: string;
}) {
  const docNum = `SHP-2026-${String(config.index).padStart(4, '0')}`;
  const shpId = generateDeterministicId(config.organizationId, docNum);
  const quantityToShip =
    config.type === 'partial'
      ? (parseFloat(config.originalQuantity) / 2).toFixed(2)
      : config.originalQuantity;

  await db
    .insert(shipments)
    .values({
      id: shpId,
      organizationId: config.organizationId,
      salesOrderId: config.soId,
      shipmentNumber: docNum,
      reference: `REF-${config.scenarioId}-${config.index}`,
      status: config.status,
      shipmentDate: config.createdAt,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [shipments.organizationId, shipments.shipmentNumber],
      set: { updatedAt: config.createdAt },
    });

  const existing = await db.query.shipments.findFirst({
    where: (sh, { and, eq }) =>
      and(eq(sh.organizationId, config.organizationId), eq(sh.shipmentNumber, docNum)),
  });
  const finalShpId = existing!.id;

  const shpLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(shipmentLines)
    .values({
      id: shpLineId,
      organizationId: config.organizationId,
      shipmentId: finalShpId,
      productId: config.productId,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: SEED_DATA.BINS.MAIN_A1,
      quantityShipped: quantityToShip,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  // ONLY process inventory side-effects if the shipment is actually SHIPPED
  if (config.status !== 'shipped') {
    return finalShpId;
  }

  /**
   * INVENTORY OUTBOUND & DE-ALLOCATION:
   * 1. Decrement 'on_hand' because goods have physically left the building.
   * 2. Decrement 'allocated' because the customer commitment has been fulfilled.
   */
  await db
    .insert(inventoryLevels)
    .values({
      organizationId: config.organizationId,
      productId: config.productId,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: SEED_DATA.BINS.MAIN_A1,
      quantityOnHand: '0',
      quantityAllocated: '0',
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [
        inventoryLevels.organizationId,
        inventoryLevels.productId,
        inventoryLevels.warehouseId,
        inventoryLevels.binId,
      ],
      set: {
        quantityOnHand: sql`GREATEST(0, ${inventoryLevels.quantityOnHand} - ${quantityToShip}::numeric)`,
        quantityAllocated: sql`GREATEST(0, ${inventoryLevels.quantityAllocated} - ${quantityToShip}::numeric)`,
        updatedAt: config.createdAt,
        updatedBy: config.userId,
      },
    });

  // Ledger entry: so_shipment — negative qty = outbound movement
  await db.insert(inventoryLedgers).values({
    organizationId: config.organizationId,
    productId: config.productId,
    warehouseId: SEED_DATA.WAREHOUSES.MAIN,
    binId: SEED_DATA.BINS.MAIN_A1,
    quantityChange: `-${quantityToShip}`,
    referenceType: 'so_shipment',
    referenceId: finalShpId,
    createdAt: config.createdAt,
    updatedAt: config.createdAt,
    createdBy: config.userId,
    updatedBy: config.userId,
  });

  return finalShpId;
}
