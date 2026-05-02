import { db } from '../../../index.js';
import {
  purchaseOrders,
  purchaseOrderLines,
  receipts,
  receiptLines,
  bills,
  billLines,
} from '../../../schema/index.js';
import { generateDeterministicId } from '../utils.js';
import { SEED_DATA } from '../../constants.js';

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
}) {
  const docNum = `RCT-2026-${String(config.index).padStart(4, '0')}`;
  const rctId = generateDeterministicId(config.organizationId, docNum);
  const quantityReceived =
    config.type === 'partial'
      ? (parseFloat(config.originalQuantity) / 2).toFixed(2)
      : config.originalQuantity;

  await db
    .insert(receipts)
    .values({
      id: rctId,
      organizationId: config.organizationId,
      purchaseOrderId: config.poId,
      receiptNumber: docNum,
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
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      quantityReceived: quantityReceived,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoNothing();

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
