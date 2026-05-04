import { db } from '../../db/index.js';
import { payments, invoices, bills, paymentIntents } from '../../db/schema/index.js';
import { and, eq, sql, desc } from 'drizzle-orm';
import { CreatePaymentInput } from '#shared/contracts/payments.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { stripe } from '../../lib/stripe.js';

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
      // 1. Find the intent
      const intent = await tx.query.paymentIntents.findFirst({
        where: eq(paymentIntents.providerRef, providerRef),
      });

      if (!intent || intent.status !== 'pending') {
        return; // Already processed or not found
      }

      // 2. Mark Intent as Succeeded
      await tx
        .update(paymentIntents)
        .set({ status: 'succeeded', updatedAt: new Date() })
        .where(eq(paymentIntents.id, intent.id));

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
        await PostingService.postPayment(payment.id, intent.organizationId);
      }

      // 4. Reconcile Invoice (or Bill)
      if (intent.invoiceId) {
        await this.reconcileInvoiceStatus(
          intent.organizationId,
          intent.createdBy || 'system',
          intent.invoiceId,
          tx,
        );
      }

      return payment;
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
      await PostingService.postPayment(payment.id, organizationId);

      // 2. Handle status updates for linked documents
      if (data.invoiceId) {
        await this.reconcileInvoiceStatus(organizationId, userId, data.invoiceId, tx);
      } else if (data.billId) {
        await this.reconcileBillStatus(organizationId, userId, data.billId, tx);
      }

      return await this.getPaymentById(organizationId, payment.id, tx);
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
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

      if (payment.invoiceId) {
        await this.reconcileInvoiceStatus(organizationId, userId, payment.invoiceId, tx);
      } else if (payment.billId) {
        await this.reconcileBillStatus(organizationId, userId, payment.billId, tx);
      }

      return true;
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

        if (p.invoiceId) invoiceIds.add(p.invoiceId);
        if (p.billId) billIds.add(p.billId);
      }

      for (const invId of invoiceIds) {
        await this.reconcileInvoiceStatus(organizationId, userId, invId, tx);
      }
      for (const bId of billIds) {
        await this.reconcileBillStatus(organizationId, userId, bId, tx);
      }

      return true;
    });
  }

  private async reconcileInvoiceStatus(
    organizationId: string,
    userId: string,
    invoiceId: string,
    tx: Transaction | typeof db,
  ) {
    const invoice = await tx.query.invoices.findFirst({
      where: and(eq(invoices.id, invoiceId), eq(invoices.organizationId, organizationId)),
    });

    if (!invoice) return;

    const totalPaidResult = await tx
      .select({ total: sql<string>`sum(amount)` })
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'completed'),
        ),
      );

    const totalPaid = Number(totalPaidResult[0]?.total || 0);
    const totalAmount = Number(invoice.totalAmount);
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    let newStatus: 'open' | 'partially_paid' | 'paid' = 'open';
    if (totalPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    await tx
      .update(invoices)
      .set(
        this.withAudit(
          {
            status: newStatus,
            balanceDue: balanceDue.toString(),
          },
          userId,
          true,
        ),
      )
      .where(eq(invoices.id, invoiceId));
  }

  private async reconcileBillStatus(
    organizationId: string,
    userId: string,
    billId: string,
    tx: Transaction | typeof db,
  ) {
    const bill = await tx.query.bills.findFirst({
      where: and(eq(bills.id, billId), eq(bills.organizationId, organizationId)),
    });

    if (!bill) return;

    const totalPaidResult = await tx
      .select({ total: sql<string>`sum(amount)` })
      .from(payments)
      .where(
        and(
          eq(payments.billId, billId),
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'completed'),
        ),
      );

    const totalPaid = Number(totalPaidResult[0]?.total || 0);
    const totalAmount = Number(bill.totalAmount);

    let newStatus: 'open' | 'paid' = 'open';
    if (totalPaid >= totalAmount) {
      newStatus = 'paid';
    }

    await tx
      .update(bills)
      .set(this.withAudit({ status: newStatus }, userId, true))
      .where(eq(bills.id, billId));
  }
}

export const paymentsService = new PaymentsService();
