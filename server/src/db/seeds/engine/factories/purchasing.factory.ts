import { db } from '../../../index.js';
import {
  purchaseOrders,
  purchaseOrderLines,
  receipts,
  receiptLines,
  bills,
  billLines,
  inventoryLevels,
  inventoryLedgers,
} from '../../../schema/index.js';
import { generateDeterministicId } from '../utils.js';
import { SEED_DATA } from '../../constants.js';
import { sql } from 'drizzle-orm';

export async function createPurchaseOrder(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  supplierId: string;
  userId: string;
  productId: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  createdAt: Date;
  quantity: string;
  unitPrice: string;
}) {
  const docNum = `PO-2026-${String(config.index).padStart(4, '0')}`;
  const poId = generateDeterministicId(config.organizationId, docNum);

  await db
    .insert(purchaseOrders)
    .values({
      id: poId,
      organizationId: config.organizationId,
      supplierId: config.supplierId,
      documentNumber: docNum,
      status: config.status,
      totalAmount: (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2),
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [purchaseOrders.organizationId, purchaseOrders.documentNumber],
      set: {
        status: config.status,
        totalAmount: (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2),
        updatedAt: config.createdAt,
      },
    });

  const existing = await db.query.purchaseOrders.findFirst({
    where: (po, { and, eq }) =>
      and(eq(po.organizationId, config.organizationId), eq(po.documentNumber, docNum)),
  });
  const finalPoId = existing!.id;

  const poLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(purchaseOrderLines)
    .values({
      id: poLineId,
      organizationId: config.organizationId,
      purchaseOrderId: finalPoId,
      productId: config.productId,
      quantity: config.quantity,
      unitPrice: config.unitPrice,
      taxRateAtOrder: '0.00',
      taxAmount: '0.00',
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  return finalPoId;
}

export async function createReceipt(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  poId: string;
  productId: string;
  userId: string;
  createdAt: Date;
  type: 'full' | 'partial';
  originalQuantity: string;
  /**
   * Target warehouse for goods receipt. Determines both the receipt_line location
   * and the inventory_levels / inventory_ledgers entries.
   * Defaults to MAIN warehouse if omitted.
   */
  warehouseId?: string;
  /**
   * Target bin within the warehouse. Optional — matches schema nullable binId.
   */
  binId?: string;
}) {
  const docNum = `RCT-2026-${String(config.index).padStart(4, '0')}`;
  const rctId = generateDeterministicId(config.organizationId, docNum);
  const quantityReceived =
    config.type === 'partial'
      ? (parseFloat(config.originalQuantity) / 2).toFixed(2)
      : config.originalQuantity;

  // Resolve warehouse/bin — default to Main Warehouse if not specified
  const targetWarehouseId = config.warehouseId ?? SEED_DATA.WAREHOUSES.MAIN;
  const targetBinId = config.binId ?? SEED_DATA.BINS.MAIN_A1;

  await db
    .insert(receipts)
    .values({
      id: rctId,
      organizationId: config.organizationId,
      purchaseOrderId: config.poId,
      receiptNumber: docNum,
      reference: `SUP-REF-${config.scenarioId}-${config.index}`,
      status: 'received',
      receivedDate: config.createdAt,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [receipts.organizationId, receipts.receiptNumber],
      set: { updatedAt: config.createdAt },
    });

  const existing = await db.query.receipts.findFirst({
    where: (rc, { and, eq }) =>
      and(eq(rc.organizationId, config.organizationId), eq(rc.receiptNumber, docNum)),
  });
  const finalRctId = existing!.id;

  const rctLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(receiptLines)
    .values({
      id: rctLineId,
      organizationId: config.organizationId,
      receiptId: finalRctId,
      productId: config.productId,
      warehouseId: targetWarehouseId,
      binId: targetBinId,
      quantityReceived: quantityReceived,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  /**
   * INVENTORY INBOUND: Every goods receipt increments on-hand stock.
   *
   * This is the "po_receipt" event in the double-entry inventory ledger —
   * the canonical source-of-truth for how stock enters the warehouse.
   * Without this, the inventory_levels table would never reflect actual
   * received goods, making stock visibility impossible.
   */
  await db
    .insert(inventoryLevels)
    .values({
      organizationId: config.organizationId,
      productId: config.productId,
      warehouseId: targetWarehouseId,
      binId: targetBinId,
      quantityOnHand: quantityReceived,
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
        quantityOnHand: sql`GREATEST(0, ${inventoryLevels.quantityOnHand} + ${quantityReceived}::numeric)`,
        updatedAt: config.createdAt,
        updatedBy: config.userId,
      },
    });

  // Ledger entry: po_receipt — traces back to the receipt header
  await db.insert(inventoryLedgers).values({
    organizationId: config.organizationId,
    productId: config.productId,
    warehouseId: targetWarehouseId,
    binId: targetBinId,
    quantityChange: quantityReceived,
    referenceType: 'po_receipt',
    referenceId: finalRctId,
    createdAt: config.createdAt,
    updatedAt: config.createdAt,
    createdBy: config.userId,
    updatedBy: config.userId,
  });

  return finalRctId;
}

export async function createBill(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  supplierId: string;
  poId: string;
  rctId: string;
  productId: string;
  userId: string;
  createdAt: Date;
  quantity: string;
  unitPrice: string;
  status: 'draft' | 'open' | 'paid' | 'void';
}) {
  const docNum = `BILL-2026-${String(config.index).padStart(4, '0')}`;
  const billId = generateDeterministicId(config.organizationId, docNum);
  const amount = (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2);

  await db
    .insert(bills)
    .values({
      id: billId,
      organizationId: config.organizationId,
      supplierId: config.supplierId,
      purchaseOrderId: config.poId,
      receiptId: config.rctId,
      documentNumber: docNum,
      referenceNumber: `VEND-INV-${config.scenarioId}-${config.index}`,
      status: config.status,
      issueDate: config.createdAt,
      dueDate: config.createdAt,
      totalAmount: amount,
      balanceDue: config.status === 'paid' ? '0.00' : amount,
      taxAmount: '0.00',
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [bills.organizationId, bills.documentNumber],
      set: { status: config.status, updatedAt: config.createdAt },
    });

  const existing = await db.query.bills.findFirst({
    where: (bl, { and, eq }) =>
      and(eq(bl.organizationId, config.organizationId), eq(bl.documentNumber, docNum)),
  });
  const finalBillId = existing!.id;

  const billLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(billLines)
    .values({
      id: billLineId,
      organizationId: config.organizationId,
      billId: finalBillId,
      productId: config.productId,
      quantity: config.quantity,
      unitPrice: config.unitPrice,
      taxRateAtOrder: '0.00',
      taxAmount: '0.00',
      lineTotal: amount,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

  return { billId: finalBillId, amount };
}
