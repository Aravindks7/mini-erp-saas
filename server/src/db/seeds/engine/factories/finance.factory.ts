import { db } from '../../../index.js';
import { invoices, invoiceLines, payments, paymentIntents } from '../../../schema/index.js';
import { generateDeterministicId } from '../utils.js';
import { PostingService } from '../../../../modules/finance/posting.service.js';

export async function createInvoice(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  customerId: string;
  soId: string;
  productId: string;
  userId: string;
  createdAt: Date;
  quantity: string;
  unitPrice: string;
  status: 'draft' | 'open' | 'paid' | 'partially_paid' | 'void';
}) {
  const docNum = `INV-2026-${String(config.index).padStart(4, '0')}`;
  const invId = generateDeterministicId(config.organizationId, docNum);
  const amount = (parseFloat(config.quantity) * parseFloat(config.unitPrice)).toFixed(2);
  const balanceDue = config.status === 'paid' ? '0.00' : amount;

  const results = await db
    .insert(invoices)
    .values({
      id: invId,
      organizationId: config.organizationId,
      customerId: config.customerId,
      salesOrderId: config.soId,
      documentNumber: docNum,
      status: config.status,
      issueDate: config.createdAt,
      dueDate: config.createdAt,
      totalAmount: amount,
      balanceDue: balanceDue,
      taxAmount: '0.00',
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [invoices.id],
      set: {
        status: config.status,
        balanceDue: balanceDue,
        updatedAt: config.createdAt,
      },
    })
    .returning({ id: invoices.id });

  const finalInvId = results[0]!.id;

  const invLineId = generateDeterministicId(config.organizationId, `${docNum}-L1`);
  await db
    .insert(invoiceLines)
    .values({
      id: invLineId,
      organizationId: config.organizationId,
      invoiceId: finalInvId,
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

  // Post to General Ledger - ONLY if NOT draft
  if (config.status !== 'draft') {
    await PostingService.postInvoice(finalInvId, config.organizationId);
  }

  return { invId: finalInvId, amount };
}

export async function createPayment(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  customerId?: string;
  supplierId?: string;
  invId?: string;
  billId?: string;
  userId: string;
  createdAt: Date;
  type: 'full' | 'partial';
  totalAmount: string;
  direction: 'inbound' | 'outbound';
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}) {
  const docNum = `PMT-2026-${String(config.index).padStart(4, '0')}`;
  const pmtId = generateDeterministicId(config.organizationId, `${config.scenarioId}-${docNum}`);
  const amountToPay =
    config.type === 'partial'
      ? (parseFloat(config.totalAmount) / 2).toFixed(2)
      : config.totalAmount;

  await db
    .insert(payments)
    .values({
      id: pmtId,
      organizationId: config.organizationId,
      customerId: config.customerId,
      supplierId: config.supplierId,
      invoiceId: config.invId,
      billId: config.billId,
      paymentType: config.direction,
      paymentMethod: 'bank_transfer',
      status: config.status || 'completed',
      referenceNumber: docNum,
      amount: amountToPay,
      paymentDate: config.createdAt,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [payments.id],
      set: {
        status: config.status || 'completed',
        updatedAt: config.createdAt,
      },
    });

  // Post to General Ledger - ONLY if COMPLETED
  if (config.status === 'completed' || config.status === undefined) {
    await PostingService.postPayment(pmtId, config.organizationId);
  }
}

export async function createPaymentIntent(config: {
  scenarioId: string;
  index: number;
  organizationId: string;
  invoiceId?: string;
  billId?: string;
  userId: string;
  createdAt: Date;
  amount: string;
  status: 'pending' | 'succeeded' | 'failed' | 'expired';
}) {
  const docNum = `PI-2026-${String(config.index).padStart(4, '0')}`;
  const piId = generateDeterministicId(config.organizationId, `${config.scenarioId}-${docNum}`);

  await db
    .insert(paymentIntents)
    .values({
      id: piId,
      organizationId: config.organizationId,
      invoiceId: config.invoiceId,
      billId: config.billId,
      amount: config.amount,
      currency: 'USD',
      status: config.status,
      provider: 'stripe',
      providerRef: `pi_${generateDeterministicId(config.scenarioId, config.index, 'stripe')}`,
      createdAt: config.createdAt,
      updatedAt: config.createdAt,
      createdBy: config.userId,
      updatedBy: config.userId,
    })
    .onConflictDoUpdate({
      target: [paymentIntents.id],
      set: {
        status: config.status,
        updatedAt: config.createdAt,
      },
    });

  return piId;
}
