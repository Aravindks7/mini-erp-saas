import { createPurchaseOrder, createReceipt, createBill } from '../factories/purchasing.factory.js';
import { createPayment } from '../factories/finance.factory.js';

export async function runP2PScenario(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  supplierId: string;
  userId: string;
  productId: string;
  createdAt: Date;
  quantity: string;
  unitPrice: string;
  /** Target warehouse for goods receipt — routed by scenario orchestrator */
  warehouseId?: string;
  /** Target bin within the warehouse */
  binId?: string;
  flow:
    | 'full'
    | 'partial_receipt_full_pay'
    | 'full_receipt_partial_pay'
    | 'draft_only'
    | 'overdue_bill'
    | 'cancelled_order'
    | 'cancelled_receipt'
    | 'void_bill'
    | 'failed_payment'
    | 'refunded_payment';
}) {
  // 1. Purchase Order
  let poStatus: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled' =
    config.flow === 'draft_only'
      ? 'draft'
      : config.flow === 'cancelled_order'
        ? 'cancelled'
        : 'sent';

  if (config.flow === 'partial_receipt_full_pay') {
    poStatus = 'partially_received';
  } else if (config.flow === 'full' || config.flow === 'refunded_payment') {
    poStatus = 'received';
  }

  const poId = await createPurchaseOrder({ ...config, status: poStatus });

  if (config.flow === 'draft_only' || config.flow === 'cancelled_order') return;

  // 2. Receipt
  // Destructure warehouse routing fields to satisfy exactOptionalPropertyTypes:
  // spreading config directly carries `warehouseId: string | undefined` which
  // is incompatible with the factory's `warehouseId?: string` signature.
  const { warehouseId, binId, ...receiptBaseConfig } = config;

  if (config.flow === 'cancelled_receipt') {
    // Schema says receiptStatusEnum: ['draft', 'received', 'cancelled']
    await createReceipt({
      ...receiptBaseConfig,
      poId,
      type: 'full',
      originalQuantity: config.quantity,
      ...(warehouseId !== undefined && { warehouseId }),
      ...(binId !== undefined && { binId }),
    });
    return;
  }

  const rctType = config.flow === 'partial_receipt_full_pay' ? 'partial' : 'full';
  const rctId = await createReceipt({
    ...receiptBaseConfig,
    poId,
    type: rctType,
    originalQuantity: config.quantity,
    ...(warehouseId !== undefined && { warehouseId }),
    ...(binId !== undefined && { binId }),
  });

  // 3. Bill
  let billStatus: 'draft' | 'open' | 'paid' | 'void' = 'open';
  if (
    config.flow === 'full' ||
    config.flow === 'partial_receipt_full_pay' ||
    config.flow === 'refunded_payment'
  ) {
    billStatus = 'paid';
  } else if (config.flow === 'void_bill') {
    billStatus = 'void';
  }

  const { billId, amount } = await createBill({ ...config, poId, rctId, status: billStatus });

  if (config.flow === 'void_bill') return;

  // 4. Payment
  if (config.flow === 'overdue_bill') return;

  let payStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'completed';
  if (config.flow === 'failed_payment') payStatus = 'failed';
  if (config.flow === 'refunded_payment') payStatus = 'refunded';

  const payType = config.flow === 'full_receipt_partial_pay' ? 'partial' : 'full';

  await createPayment({
    ...config,
    billId,
    type: payType,
    totalAmount: amount,
    direction: 'outbound',
    status: payStatus,
  });
}
