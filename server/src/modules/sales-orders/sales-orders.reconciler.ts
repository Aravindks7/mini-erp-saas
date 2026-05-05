import { db } from '../../db/index.js';
import { salesOrders } from '../../db/schema/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type SOStatus =
  | 'draft'
  | 'approved'
  | 'partially_shipped'
  | 'shipped'
  | 'closed'
  | 'cancelled';

export class SalesOrderReconciler {
  private static readonly SO_TRANSITIONS: Record<SOStatus, SOStatus[]> = {
    draft: ['approved', 'cancelled'],
    approved: ['partially_shipped', 'shipped', 'cancelled'],
    partially_shipped: ['shipped', 'cancelled'],
    shipped: ['closed', 'cancelled'],
    closed: [],
    cancelled: [],
  };

  /**
   * Directly updates the status of a Sales Order, enforcing state machine rules
   * and writing to the Business Activity Log.
   */
  static async updateStatus(
    organizationId: string,
    userId: string,
    id: string,
    newStatus: SOStatus,
    reason: string,
    tx: Transaction,
  ) {
    const existing = await tx.query.salesOrders.findFirst({
      where: and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)),
    });

    if (!existing) throw new Error('Sales order not found');

    if (existing.status === newStatus) return existing.status;

    // Validate transition
    const allowed = this.SO_TRANSITIONS[existing.status as SOStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Business Rule Violation: Cannot move Sales Order ${existing.documentNumber} from ${existing.status} to ${newStatus}`,
      );
    }

    // 1. Transactional Update (Derived State Change)
    await tx
      .update(salesOrders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: userId,
        version: sql`${salesOrders.version} + 1`,
      })
      .where(and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)));

    // 2. Business Activity Log (Temporal Narrative)
    await ActivityLogger.record(tx, {
      organizationId,
      entityType: 'sales_order',
      entityId: id,
      action: 'STATUS_CHANGED',
      reason: reason || `Status changed from ${existing.status} to ${newStatus}`,
      snapshot: { previousStatus: existing.status, newStatus },
      userId,
    });

    return newStatus;
  }

  /**
   * Reconciles the fulfillment status of a Sales Order based on linked shipments.
   */
  static async reconcileFulfillment(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction,
  ) {
    const so = await tx.query.salesOrders.findFirst({
      where: and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)),
      with: {
        lines: true,
        shipments: {
          where: (shipments, { and, isNull, ne }) =>
            and(isNull(shipments.deletedAt), ne(shipments.status, 'cancelled')),
          with: {
            lines: true,
          },
        },
      },
    });

    if (!so) return;

    const shippedMap: Record<string, number> = {};
    for (const shipment of so.shipments) {
      for (const line of shipment.lines) {
        if (line.salesOrderLineId) {
          shippedMap[line.salesOrderLineId] =
            (shippedMap[line.salesOrderLineId] || 0) + Number(line.quantityShipped);
        }
      }
    }

    let anyShipped = false;
    let allShipped = true;

    for (const line of so.lines) {
      const shipped = shippedMap[line.id] || 0;
      const ordered = Number(line.quantity);

      if (shipped > 0) anyShipped = true;
      if (shipped < ordered) allShipped = false;
    }

    let newStatus: SOStatus = so.status as SOStatus;
    if (allShipped && so.lines.length > 0) {
      newStatus = 'shipped';
    } else if (anyShipped) {
      newStatus = 'partially_shipped';
    } else if (so.status !== 'draft' && so.status !== 'cancelled') {
      newStatus = 'approved';
    }

    if (newStatus !== so.status) {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        newStatus,
        'System reconciliation of fulfillment',
        tx,
      );
    }

    // After fulfillment check, check if we can close the order
    await this.reconcileBilling(organizationId, userId, id, tx);
  }

  /**
   * Reconciles the billing status of a Sales Order based on linked invoices.
   */
  static async reconcileBilling(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction,
  ) {
    const so = await tx.query.salesOrders.findFirst({
      where: and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)),
      with: {
        invoices: {
          where: (invoices, { and, isNull, ne }) =>
            and(isNull(invoices.deletedAt), ne(invoices.status, 'void')),
        },
      },
    });

    if (!so) return;

    const hasInvoices = so.invoices.length > 0;
    const allInvoicesPaid = hasInvoices && so.invoices.every((inv) => inv.status === 'paid');

    if (so.status === 'shipped' && allInvoicesPaid) {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        'closed',
        'System reconciliation of billing',
        tx,
      );
    }
  }
}
