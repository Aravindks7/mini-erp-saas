import { db } from '../../db/index.js';
import { payments, invoices, bills } from '../../db/schema/index.js';
import { and, eq, sql, desc } from 'drizzle-orm';
import { CreatePaymentInput } from '#shared/contracts/payments.contract.js';
import { BaseService } from '../../lib/base.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class PaymentsService extends BaseService<typeof payments> {
  constructor() {
    super(payments);
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

      await tx
        .delete(payments)
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
      const paymentsToDelete = await tx.query.payments.findMany({
        where: and(sql`${payments.id} IN ${ids}`, eq(payments.organizationId, organizationId)),
      });

      const invoiceIds = new Set<string>();
      const billIds = new Set<string>();

      paymentsToDelete.forEach((p) => {
        if (p.invoiceId) invoiceIds.add(p.invoiceId);
        if (p.billId) billIds.add(p.billId);
      });

      await tx
        .delete(payments)
        .where(and(sql`${payments.id} IN ${ids}`, eq(payments.organizationId, organizationId)));

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
