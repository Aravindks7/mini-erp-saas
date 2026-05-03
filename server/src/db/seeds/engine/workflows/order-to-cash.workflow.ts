import { createSalesOrder, createShipment } from '../factories/sales.factory.js';
import { createInvoice, createPayment, createPaymentIntent } from '../factories/finance.factory.js';

export async function runO2CScenario(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  customerId: string;
  userId: string;
  productId: string;
  createdAt: Date;
  quantity: string;
  unitPrice: string;
  flow:
    | 'full'
    | 'partial_ship_full_pay'
    | 'full_ship_partial_pay'
    | 'draft_only'
    | 'overdue_invoice'
    | 'cancelled_order'
    | 'cancelled_shipment'
    | 'void_invoice'
    | 'failed_payment'
    | 'refunded_payment'
    | 'stripe_pending'
    | 'stripe_failed'
    | 'stripe_expired';
}) {
  // 1. Sales Order
  let soStatus: 'draft' | 'approved' | 'partially_shipped' | 'shipped' | 'cancelled' =
    config.flow === 'draft_only'
      ? 'draft'
      : config.flow === 'cancelled_order'
        ? 'cancelled'
        : 'approved';

  if (config.flow === 'partial_ship_full_pay') {
    soStatus = 'partially_shipped';
  } else if (config.flow === 'full' || config.flow === 'refunded_payment') {
    soStatus = 'shipped';
  }

  const soId = await createSalesOrder({ ...config, status: soStatus });

  if (config.flow === 'draft_only' || config.flow === 'cancelled_order') return;

  // 2. Shipment
  let shipStatus: 'draft' | 'shipped' | 'cancelled' = 'shipped';
  if (config.flow === 'cancelled_shipment') {
    shipStatus = 'cancelled';
  }

  const shipType = config.flow === 'partial_ship_full_pay' ? 'partial' : 'full';
  await createShipment({
    ...config,
    soId,
    type: shipType,
    status: shipStatus,
    originalQuantity: config.quantity,
  });

  if (config.flow === 'cancelled_shipment') return;

  // 3. Invoice
  let invStatus: 'draft' | 'open' | 'paid' | 'partially_paid' | 'void' = 'open';
  if (
    config.flow === 'full' ||
    config.flow === 'partial_ship_full_pay' ||
    config.flow === 'refunded_payment'
  ) {
    invStatus = 'paid';
  } else if (config.flow === 'full_ship_partial_pay') {
    invStatus = 'partially_paid';
  } else if (config.flow === 'void_invoice') {
    invStatus = 'void';
  }

  const { invId, amount } = await createInvoice({ ...config, soId, status: invStatus });

  if (config.flow === 'void_invoice') return;

  // 4. Stripe Simulation (Payment Intents)
  if (config.flow.startsWith('stripe_')) {
    const piStatus =
      config.flow === 'stripe_pending'
        ? 'pending'
        : config.flow === 'stripe_failed'
          ? 'failed'
          : 'expired';
    await createPaymentIntent({ ...config, invoiceId: invId, amount, status: piStatus });
    return;
  }

  // 5. Payments
  if (config.flow === 'overdue_invoice') return;

  let payStatus: 'pending' | 'completed' | 'failed' | 'refunded' = 'completed';
  if (config.flow === 'failed_payment') payStatus = 'failed';
  if (config.flow === 'refunded_payment') payStatus = 'refunded';

  const payType = config.flow === 'full_ship_partial_pay' ? 'partial' : 'full';

  await createPayment({
    ...config,
    invId,
    type: payType,
    totalAmount: amount,
    direction: 'inbound',
    status: payStatus,
  });
}
