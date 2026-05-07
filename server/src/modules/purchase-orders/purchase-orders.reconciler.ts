import { db } from '../../db/index.js';
import { purchaseOrders, purchaseOrderLines, receipts } from '../../db/schema/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { ActivityLogger } from '../../lib/activity-logger.js';
import type { ActivityAction } from '#shared/config/activity-actions.config.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type POStatus = 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';

export class PurchaseOrderReconciler {
  private static readonly PO_TRANSITIONS: Record<POStatus, POStatus[]> = {
    draft: ['sent', 'cancelled'],
    sent: ['partially_received', 'received', 'cancelled'],
    partially_received: ['received', 'cancelled'],
    received: ['cancelled'], // Usually no transitions out of received unless cancelled
    cancelled: [],
  };

  /**
   * Directly updates the status of a Purchase Order, enforcing state machine rules
   * and writing to the Business Activity Log.
   */
  static async updateStatus(
    organizationId: string,
    userId: string,
    id: string,
    newStatus: POStatus,
    action: ActivityAction,
    reason: string,
    tx: Transaction,
  ) {
    const existing = await tx.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)),
    });

    if (!existing) throw new Error('Purchase order not found');

    if (existing.status === newStatus) return existing.status;

    // Validate transition
    const allowed = this.PO_TRANSITIONS[existing.status as POStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Business Rule Violation: Cannot move Purchase Order ${existing.documentNumber} from ${existing.status} to ${newStatus}`,
      );
    }

    // 1. Transactional Update (Derived State Change)
    await tx
      .update(purchaseOrders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: userId,
        version: sql`${purchaseOrders.version} + 1`,
      })
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)));

    // 2. Business Activity Log (Temporal Narrative)
    await ActivityLogger.record(tx, {
      organizationId,
      entityType: 'purchase_order',
      entityId: id,
      entityDisplayId: existing.documentNumber,
      entityLabel: 'Purchase Order',
      action,
      reason: reason || `Status changed from ${existing.status} to ${newStatus}`,
      snapshot: { previousStatus: existing.status, newStatus },
      userId,
    });

    return newStatus;
  }

  /**
   * Reconciles the receiving status of a Purchase Order based on linked receipts.
   */
  static async reconcileReceiving(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction,
  ) {
    // 1. Get PO Lines (Expected)
    const poLines = await tx.query.purchaseOrderLines.findMany({
      where: and(
        eq(purchaseOrderLines.purchaseOrderId, id),
        eq(purchaseOrderLines.organizationId, organizationId),
      ),
    });

    if (poLines.length === 0) return;

    // 2. Get All Receipts for this PO (Actual)
    const allReceipts = await tx.query.receipts.findMany({
      where: and(
        eq(receipts.purchaseOrderId, id),
        eq(receipts.organizationId, organizationId),
        sql`${receipts.deletedAt} IS NULL`,
        sql`${receipts.status} != 'cancelled'`,
      ),
      with: {
        lines: true,
      },
    });

    // 3. Aggregate received quantities by PO Line ID
    const receivedMap: Record<string, number> = {};
    for (const receipt of allReceipts) {
      for (const line of receipt.lines) {
        if (line.purchaseOrderLineId) {
          receivedMap[line.purchaseOrderLineId] =
            (receivedMap[line.purchaseOrderLineId] || 0) + Number(line.quantityReceived);
        }
      }
    }

    // 4. Compare
    let anyReceived = false;
    let allReceived = true;

    for (const poLine of poLines) {
      const received = receivedMap[poLine.id] || 0;
      const ordered = Number(poLine.quantity);

      if (received > 0) anyReceived = true;
      if (received < ordered) allReceived = false;
    }

    // 5. Update Status
    let newStatus: POStatus = 'sent';
    if (allReceived) {
      newStatus = 'received';
    } else if (anyReceived) {
      newStatus = 'partially_received';
    }

    const po = await tx.query.purchaseOrders.findFirst({
      where: and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)),
    });

    if (po && po.status !== newStatus && po.status !== 'cancelled' && po.status !== 'draft') {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        newStatus,
        'SYSTEM_RECONCILIATION',
        'System reconciliation of receiving',
        tx,
      );
    }
  }
}
