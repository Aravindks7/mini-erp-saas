import { db } from '../../../index.js';
import {
  inventoryAdjustments,
  inventoryAdjustmentLines,
  inventoryTransfers,
  inventoryTransferLines,
  inventoryLevels,
  inventoryLedgers,
} from '../../../schema/index.js';
import { generateDeterministicId } from '../utils.js';
import { sql } from 'drizzle-orm';

export async function createAdjustment(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  userId: string;
  productId: string;
  warehouseId: string;
  binId: string;
  quantityChange: string;
  reason: string;
  status: 'draft' | 'approved' | 'cancelled';
  createdAt: Date;
}) {
  const docNum = `ADJ-2026-${String(config.index).padStart(4, '0')}`;
  const adjId = generateDeterministicId(config.organizationId, docNum);

  const results = await db
    .insert(inventoryAdjustments)
    .values({
      id: adjId,
      organizationId: config.organizationId,
      adjustmentDate: config.createdAt,
      reason: config.reason,
      reference: docNum,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [inventoryAdjustments.id],
      set: {
        status: config.status,
        updatedAt: config.createdAt,
      },
    })
    .returning({ id: inventoryAdjustments.id });

  const finalAdjId = results[0]!.id;

  const adjLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(inventoryAdjustmentLines)
    .values({
      id: adjLineId,
      organizationId: config.organizationId,
      adjustmentId: finalAdjId,
      productId: config.productId,
      warehouseId: config.warehouseId,
      binId: config.binId,
      quantityChange: config.quantityChange,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  if (config.status !== 'approved') {
    return finalAdjId;
  }

  // Atomic Upsert for Inventory Levels
  await db
    .insert(inventoryLevels)
    .values({
      organizationId: config.organizationId,
      productId: config.productId,
      warehouseId: config.warehouseId,
      binId: config.binId,
      quantityOnHand: sql`GREATEST(0, ${config.quantityChange}::numeric)`,
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
        quantityOnHand: sql`GREATEST(0, ${inventoryLevels.quantityOnHand} + ${config.quantityChange}::numeric)`,
        updatedAt: config.createdAt,
        updatedBy: config.userId,
      },
    });

  // Ledger Entry
  await db.insert(inventoryLedgers).values({
    organizationId: config.organizationId,
    productId: config.productId,
    warehouseId: config.warehouseId,
    binId: config.binId,
    quantityChange: config.quantityChange,
    referenceType: 'adjustment',
    referenceId: finalAdjId,
    createdAt: config.createdAt,
    updatedAt: config.createdAt,
    createdBy: config.userId,
    updatedBy: config.userId,
  });

  return finalAdjId;
}

export async function createTransfer(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  userId: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: string;
  status: 'draft' | 'shipped' | 'received' | 'cancelled';
  createdAt: Date;
}) {
  const docNum = `TRF-2026-${String(config.index).padStart(4, '0')}`;
  const trfId = generateDeterministicId(config.organizationId, docNum);

  const results = await db
    .insert(inventoryTransfers)
    .values({
      id: trfId,
      organizationId: config.organizationId,
      fromWarehouseId: config.fromWarehouseId,
      toWarehouseId: config.toWarehouseId,
      transferDate: config.createdAt,
      reference: docNum,
      status: config.status,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [inventoryTransfers.id],
      set: {
        status: config.status,
        updatedAt: config.createdAt,
      },
    })
    .returning({ id: inventoryTransfers.id });

  const finalTrfId = results[0]!.id;

  const trfLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(inventoryTransferLines)
    .values({
      id: trfLineId,
      organizationId: config.organizationId,
      transferId: finalTrfId,
      productId: config.productId,
      quantity: config.quantity,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  if (config.status === 'cancelled' || config.status === 'draft') {
    return finalTrfId;
  }

  // --- Inventory Side Effects ---

  // 1. Outbound Leg (Shipped or Received)
  // Always subtract from source when shipped
  await db
    .insert(inventoryLevels)
    .values({
      organizationId: config.organizationId,
      productId: config.productId,
      warehouseId: config.fromWarehouseId,
      binId: null, // Transfers might not specify bin yet, using null or default
      quantityOnHand: '0',
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
        quantityOnHand: sql`GREATEST(0, ${inventoryLevels.quantityOnHand} - ${config.quantity}::numeric)`,
        updatedAt: config.createdAt,
        updatedBy: config.userId,
      },
    });

  // Outbound Ledger
  await db.insert(inventoryLedgers).values({
    organizationId: config.organizationId,
    productId: config.productId,
    warehouseId: config.fromWarehouseId,
    binId: null,
    quantityChange: `-${config.quantity}`,
    referenceType: 'transfer',
    referenceId: finalTrfId,
    createdAt: config.createdAt,
    updatedAt: config.createdAt,
    createdBy: config.userId,
    updatedBy: config.userId,
  });

  // 2. Inbound Leg (Only if Received)
  if (config.status === 'received') {
    await db
      .insert(inventoryLevels)
      .values({
        organizationId: config.organizationId,
        productId: config.productId,
        warehouseId: config.toWarehouseId,
        binId: null,
        quantityOnHand: config.quantity,
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
          quantityOnHand: sql`GREATEST(0, ${inventoryLevels.quantityOnHand} + ${config.quantity}::numeric)`,
          updatedAt: config.createdAt,
          updatedBy: config.userId,
        },
      });

    // Inbound Ledger
    await db.insert(inventoryLedgers).values({
      organizationId: config.organizationId,
      productId: config.productId,
      warehouseId: config.toWarehouseId,
      binId: null,
      quantityChange: config.quantity,
      referenceType: 'transfer',
      referenceId: finalTrfId,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    });
  }

  return finalTrfId;
}
