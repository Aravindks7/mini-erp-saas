import { db } from '../../db/index.js';
import { payments, invoices, bills, paymentIntents } from '../../db/schema/index.js';
import { and, eq, sql, desc } from 'drizzle-orm';
import { CreatePaymentInput, UpdatePaymentInput } from '#shared/contracts/payments.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { stripe } from '../../lib/stripe.js';
import { InvoiceReconciler } from '../invoices/invoices.reconciler.js';
import { BillReconciler } from '../bills/bills.reconciler.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class PaymentsService extends BaseService<typeof payments> {
  constructor() {
    super(payments);
  }

  /**
   * Creates a Stripe Checkout Session and tracks it as a Payment Intent.
   * Axiom: Intent (expected funds) is tracked separately from Payment (realized funds).
   */
  async createStripeSession(
    organizationId: string,
    userId: string,
    invoiceId: string,
    amount: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)),
      with: {
        customer: {
          with: {
            contacts: {
              where: (contacts, { eq }) => eq(contacts.isPrimary, true),
              with: { contact: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // 1. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Payment for Invoice ${invoice.documentNumber}`,
              description: `Organization: ${organizationId}`,
            },
            unit_amount: Math.round(Number(amount) * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: invoiceId,
      metadata: {
        organizationId,
        invoiceId,
        userId,
      },
      ...(invoice.customer?.contacts?.[0]?.contact?.email && {
        customer_email: invoice.customer.contacts[0].contact.email,
      }),
    });

    // 2. Track in Local DB as Pending Intent
    await db.insert(paymentIntents).values(
      this.withAudit(
        {
          organizationId,
          invoiceId,
          amount,
          status: 'pending',
          provider: 'stripe',
          providerRef: session.id,
          metadata: { sessionId: session.id },
        },
        userId,
      ),
    );

    return { url: session.url };
  }

  /**
   * Fulfills a Payment Intent via Webhook.
   * Atomically: Intent succeeded -> Create Payment -> Reconcile Invoice.
   */
  async fulfillPaymentIntent(providerRef: string) {
    return await db.transaction(async (tx) => {
      // 1. Find the intent and lock it to serialize concurrent webhook notifications
      const [intent] = await tx
        .select()
        .from(paymentIntents)
        .where(eq(paymentIntents.providerRef, providerRef))
        .for('update');

      if (!intent || intent.status !== 'pending') {
        return; // Already processed or not found
      }

      // 2. Mark Intent as Succeeded
      await tx
        .update(paymentIntents)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(paymentIntents.id, intent.id));

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId: intent.organizationId,
          userId: intent.createdBy || 'system',
          entityType: 'payment_intent',
          entityId: intent.id,
          entityDisplayId: intent.providerRef,
          entityLabel: 'Payment Intent',
          action: 'STATUS_CHANGED',
          reason: 'Stripe webhook fulfillment',
        },
        intent,
        { status: 'succeeded' },
      );

      // 3. Create Realized Payment
      const [payment] = await tx
        .insert(payments)
        .values(
          this.withAudit(
            {
              organizationId: intent.organizationId,
              paymentType: 'inbound',
              paymentMethod: 'credit_card',
              status: 'completed',
              amount: intent.amount,
              paymentDate: new Date(),
              referenceNumber: `STRIPE-${providerRef}`,
              invoiceId: intent.invoiceId,
              paymentIntentId: intent.id,
              notes: 'Stripe Checkout Payment',
            },
            intent.createdBy || 'system',
          ),
        )
        .returning();

      // 3a. Post to GL
      if (payment) {
        const { PostingService } = await import('../finance/posting.service.js');
        await PostingService.postPayment(payment.id, intent.organizationId, tx as Transaction);
      }

      // 4. Reconcile Invoice (or Bill)
      if (intent.invoiceId) {
        await InvoiceReconciler.reconcilePayment(
          intent.organizationId,
          intent.createdBy || 'system',
          intent.invoiceId,
          tx as Transaction,
        );
      }

      if (payment) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId: intent.organizationId,
          entityType: 'payment',
          entityId: payment.id,
          entityDisplayId: payment.id,
          entityLabel: 'Payment',
          action: 'PAYMENT_REALIZED',
          reason: 'Payment fulfilled via Stripe webhook',
          userId: intent.createdBy || 'system',
        });

        return await this.getPaymentById(intent.organizationId, payment.id, tx);
      }
    });
  }

  async listPayments(organizationId: string) {
    return await db.query.payments.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        customer: true,
        supplier: true,
        invoice: true,
        bill: true,
      },
      orderBy: [desc(payments.paymentDate)],
    });
  }

  async getPaymentById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.payments.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        customer: true,
        supplier: true,
        invoice: true,
        bill: true,
      },
    });
  }

  async createPayment(
    organizationId: string,
    userId: string,
    data: CreatePaymentInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      // 0. Pre-flight Balance Validation
      if (data.invoiceId) {
        const invoice = await tx.query.invoices.findFirst({
          where: and(eq(invoices.id, data.invoiceId), eq(invoices.organizationId, organizationId)),
        });

        if (invoice) {
          const totalPaidResult = await tx
            .select({ total: sql<string>`sum(amount)` })
            .from(payments)
            .where(
              and(
                eq(payments.invoiceId, data.invoiceId),
                eq(payments.organizationId, organizationId),
                eq(payments.status, 'completed'),
              ),
            );

          const totalPaid = Number(totalPaidResult[0]?.total || 0);
          const remaining = Number(invoice.totalAmount) - totalPaid;

          if (Number(data.amount) > remaining + 0.01) {
            // Small buffer for floating point
            throw new Error(
              `Over-payment violation: Invoice has only ${remaining.toFixed(2)} remaining, but ${Number(data.amount).toFixed(2)} was requested.`,
            );
          }
        }
      } else if (data.billId) {
        const bill = await tx.query.bills.findFirst({
          where: and(eq(bills.id, data.billId), eq(bills.organizationId, organizationId)),
        });

        if (bill) {
          const totalPaidResult = await tx
            .select({ total: sql<string>`sum(amount)` })
            .from(payments)
            .where(
              and(
                eq(payments.billId, data.billId),
                eq(payments.organizationId, organizationId),
                eq(payments.status, 'completed'),
              ),
            );

          const totalPaid = Number(totalPaidResult[0]?.total || 0);
          const remaining = Number(bill.totalAmount) - totalPaid;

          if (Number(data.amount) > remaining + 0.01) {
            throw new Error(
              `Over-payment violation: Bill has only ${remaining.toFixed(2)} remaining, but ${Number(data.amount).toFixed(2)} was requested.`,
            );
          }
        }
      }

      // 1. Insert Payment record
      const [payment] = await tx
        .insert(payments)
        .values(
          this.withAudit(
            {
              organizationId,
              ...data,
              status: 'completed', // Defaulting to completed for now
            },
            userId,
          ),
        )
        .returning();

      if (!payment) {
        throw new Error('Failed to create payment record');
      }

      // 1a. Post to GL
      const { PostingService } = await import('../finance/posting.service.js');
      await PostingService.postPayment(payment.id, organizationId, tx);

      // 2. Handle status updates for linked documents
      if (data.invoiceId) {
        await InvoiceReconciler.reconcilePayment(
          organizationId,
          userId,
          data.invoiceId,
          tx as Transaction,
        );
      } else if (data.billId) {
        await BillReconciler.reconcilePayment(
          organizationId,
          userId,
          data.billId,
          tx as Transaction,
        );
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'payment',
        entityId: payment.id,
        entityDisplayId: payment.id,
        entityLabel: 'Payment',
        action: 'PAYMENT_CREATED',
        reason: 'Manual payment recorded',
        userId,
      });

      return await this.getPaymentById(organizationId, payment.id, tx);
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }
  async updatePayment(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdatePaymentInput,
  ) {
    return await db.transaction(async (tx) => {
      const existing = await this.getPaymentById(organizationId, id, tx);
      if (!existing) throw new Error('Payment not found');

      const { reason, ...updateData } = data;

      const [updated] = await tx
        .update(payments)
        .set(this.withAudit(updateData, userId, true))
        .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
        .returning();

      if (updated) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'payment',
            entityId: id,
            entityDisplayId: id,
            entityLabel: 'Payment',
            action: 'UPDATED',
            reason: reason || 'Payment metadata updated',
          },
          existing,
          updateData,
        );
      }

      return await this.getPaymentById(organizationId, id, tx);
    });
  }
  async deletePayment(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const payment = await this.getPaymentById(organizationId, id, tx);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const newStatus = payment.status === 'pending' ? 'failed' : 'refunded';

      await tx
        .update(payments)
        .set(this.withAudit({ status: newStatus }, userId, true))
        .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)));

      // Post counters to GL for GAAP compliance on completed payments
      if (payment.status === 'completed') {
        const { PostingService } = await import('../finance/posting.service.js');
        await PostingService.postPaymentReversal(payment.id, organizationId, tx);
      }

      if (payment.invoiceId) {
        await InvoiceReconciler.reconcilePayment(
          organizationId,
          userId,
          payment.invoiceId,
          tx as Transaction,
        );
      } else if (payment.billId) {
        await BillReconciler.reconcilePayment(
          organizationId,
          userId,
          payment.billId,
          tx as Transaction,
        );
      }

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'payment',
          entityId: id,
          entityDisplayId: id,
          entityLabel: 'Payment',
          action: 'STATUS_CHANGED',
          reason: `Payment status transitioned to ${newStatus}`,
        },
        payment,
        { status: newStatus },
      );

      return await this.getPaymentById(organizationId, id, tx);
    });
  }

  async bulkDeletePayments(organizationId: string, userId: string, ids: string[]) {
    return await db.transaction(async (tx) => {
      const paymentsToUpdate = await tx.query.payments.findMany({
        where: and(sql`${payments.id} IN ${ids}`, eq(payments.organizationId, organizationId)),
      });

      const invoiceIds = new Set<string>();
      const billIds = new Set<string>();

      for (const p of paymentsToUpdate) {
        const newStatus = p.status === 'pending' ? 'failed' : 'refunded';

        await tx
          .update(payments)
          .set(this.withAudit({ status: newStatus }, userId, true))
          .where(and(eq(payments.id, p.id), eq(payments.organizationId, organizationId)));

        // Post counters to GL for GAAP compliance on completed payments
        if (p.status === 'completed') {
          const { PostingService } = await import('../finance/posting.service.js');
          await PostingService.postPaymentReversal(p.id, organizationId, tx);
        }

        if (p.invoiceId) invoiceIds.add(p.invoiceId);
        if (p.billId) billIds.add(p.billId);

        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          entityType: 'payment',
          entityId: p.id,
          entityDisplayId: p.id,
          entityLabel: 'Payment',
          action: newStatus === 'failed' ? 'PAYMENT_FAILED' : 'PAYMENT_REFUNDED',
          reason: `Payment bulk processed as ${newStatus}`,
          userId,
        });
      }

      for (const invId of invoiceIds) {
        await InvoiceReconciler.reconcilePayment(organizationId, userId, invId, tx as Transaction);
      }
      for (const bId of billIds) {
        await BillReconciler.reconcilePayment(organizationId, userId, bId, tx as Transaction);
      }

      return true;
    });
  }
}

export const paymentsService = new PaymentsService();
