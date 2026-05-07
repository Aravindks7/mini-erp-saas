import { db } from '../../db/index.js';
import { invoices, payments } from '../../db/schema/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { ActivityLogger } from '../../lib/activity-logger.js';
import type { ActivityAction } from '#shared/config/activity-actions.config.js';
import { salesOrdersService } from '../sales-orders/sales-orders.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type InvoiceStatus = 'draft' | 'open' | 'partially_paid' | 'paid' | 'void';

export class InvoiceReconciler {
  private static readonly INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
    draft: ['open', 'void'],
    open: ['partially_paid', 'paid', 'void'],
    partially_paid: ['paid', 'void'],
    paid: ['void'], // Voiding a paid invoice requires voiding payments first
    void: [],
  };

  /**
   * Directly updates the status of an Invoice, enforcing state machine rules
   * and writing to the Business Activity Log.
   * If moving to 'open', triggers GL posting.
   */
  static async updateStatus(
    organizationId: string,
    userId: string,
    id: string,
    newStatus: InvoiceStatus,
    action: ActivityAction,
    reason: string,
    tx: Transaction,
  ) {
    const existing = await tx.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
    });

    if (!existing) throw new Error('Invoice not found');

    if (existing.status === newStatus) return existing.status;

    // Validate transition
    const allowed = this.INVOICE_TRANSITIONS[existing.status as InvoiceStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Business Rule Violation: Cannot move Invoice ${existing.documentNumber} from ${existing.status} to ${newStatus}`,
      );
    }

    // 1. Transactional Update (Derived State Change)
    const updateData: Partial<typeof invoices.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      version: sql`${invoices.version} + 1` as any,
    };

    if (newStatus === 'void') {
      updateData.balanceDue = '0';
    }

    await tx
      .update(invoices)
      .set(updateData)
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));

    // 2. Trigger GL Posting if transitioning to 'open'
    if (newStatus === 'open') {
      const { PostingService } = await import('../finance/posting.service.js');
      await PostingService.postInvoice(id, organizationId, tx);
    }

    // 3. Reconcile Sales Order Billing (if linked)
    if (existing.salesOrderId && (newStatus === 'paid' || existing.status === 'paid')) {
      await salesOrdersService.reconcileBilling(organizationId, userId, existing.salesOrderId, tx);
    }

    // 4. Business Activity Log (Temporal Narrative)
    await ActivityLogger.record(tx, {
      organizationId,
      entityType: 'invoice',
      entityId: id,
      entityDisplayId: existing.documentNumber,
      entityLabel: 'Invoice',
      action,
      reason: reason || `Status changed from ${existing.status} to ${newStatus}`,
      snapshot: { previousStatus: existing.status, newStatus },
      userId,
    });

    return newStatus;
  }

  /**
   * Reconciles the payment status and balance due of an Invoice based on completed payments.
   */
  static async reconcilePayment(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction,
  ) {
    const invoice = await tx.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)),
    });

    if (!invoice) return;

    const totalPaidResult = await tx
      .select({ total: sql<string>`sum(amount)` })
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, id),
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'completed'),
        ),
      );

    const totalPaid = Number(totalPaidResult[0]?.total || 0);
    const totalAmount = Number(invoice.totalAmount);
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    // Update Balance Due
    await tx
      .update(invoices)
      .set({
        balanceDue: balanceDue.toString(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(invoices.id, id));

    let newStatus: InvoiceStatus = 'open';
    if (totalPaid >= totalAmount) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partially_paid';
    }

    if (newStatus !== invoice.status && invoice.status !== 'void' && invoice.status !== 'draft') {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        newStatus,
        'SYSTEM_RECONCILIATION',
        'System reconciliation of payments',
        tx,
      );
    }
  }
}
