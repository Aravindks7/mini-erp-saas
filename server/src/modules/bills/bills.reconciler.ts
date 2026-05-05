import { db } from '../../db/index.js';
import { bills, payments } from '../../db/schema/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type BillStatus = 'draft' | 'open' | 'paid' | 'void';

export class BillReconciler {
  private static readonly BILL_TRANSITIONS: Record<BillStatus, BillStatus[]> = {
    draft: ['open', 'void'],
    open: ['paid', 'void'],
    paid: ['void'], // Voiding a paid bill requires voiding payments first
    void: [],
  };

  /**
   * Directly updates the status of a Bill, enforcing state machine rules
   * and writing to the Business Activity Log.
   * If moving to 'open', triggers GL posting.
   */
  static async updateStatus(
    organizationId: string,
    userId: string,
    id: string,
    newStatus: BillStatus,
    reason: string,
    tx: Transaction,
  ) {
    const existing = await tx.query.bills.findFirst({
      where: and(eq(bills.id, id), eq(bills.organizationId, organizationId)),
    });

    if (!existing) throw new Error('Bill not found');

    if (existing.status === newStatus) return existing.status;

    // Validate transition
    const allowed = this.BILL_TRANSITIONS[existing.status as BillStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Business Rule Violation: Cannot move Bill ${existing.documentNumber} from ${existing.status} to ${newStatus}`,
      );
    }

    // 1. Transactional Update (Derived State Change)
    const updateData: Partial<typeof bills.$inferInsert> = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      version: sql`${bills.version} + 1` as any,
    };

    if (newStatus === 'void') {
      updateData.balanceDue = '0';
    }

    await tx
      .update(bills)
      .set(updateData)
      .where(and(eq(bills.id, id), eq(bills.organizationId, organizationId)));

    // 2. Trigger GL Posting if transitioning to 'open'
    if (newStatus === 'open') {
      const { PostingService } = await import('../finance/posting.service.js');
      await PostingService.postBill(id, organizationId, tx);
    }

    // 3. Business Activity Log (Temporal Narrative)
    await ActivityLogger.record(tx, {
      organizationId,
      entityType: 'bill',
      entityId: id,
      action: 'STATUS_CHANGED',
      reason: reason || `Status changed from ${existing.status} to ${newStatus}`,
      snapshot: { previousStatus: existing.status, newStatus },
      userId,
    });

    return newStatus;
  }

  /**
   * Reconciles the payment status and balance due of a Bill based on completed payments.
   */
  static async reconcilePayment(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction,
  ) {
    const bill = await tx.query.bills.findFirst({
      where: and(eq(bills.id, id), eq(bills.organizationId, organizationId)),
    });

    if (!bill) return;

    const totalPaidResult = await tx
      .select({ total: sql<string>`sum(amount)` })
      .from(payments)
      .where(
        and(
          eq(payments.billId, id),
          eq(payments.organizationId, organizationId),
          eq(payments.status, 'completed'),
        ),
      );

    const totalPaid = Number(totalPaidResult[0]?.total || 0);
    const totalAmount = Number(bill.totalAmount);
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    // Update Balance Due
    await tx
      .update(bills)
      .set({
        balanceDue: balanceDue.toString(),
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(bills.id, id));

    let newStatus: BillStatus = 'open';
    if (totalPaid >= totalAmount) {
      newStatus = 'paid';
    }

    if (newStatus !== bill.status && bill.status !== 'void' && bill.status !== 'draft') {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        newStatus,
        'System reconciliation of payments',
        tx,
      );
    }
  }
}
