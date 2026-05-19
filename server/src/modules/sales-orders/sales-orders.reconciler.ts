import { db } from '../../db/index.js';
import { salesOrders, inventoryLevels } from '../../db/schema/index.js';
import { and, eq, sql, isNull } from 'drizzle-orm';
import { ActivityLogger } from '../../lib/activity-logger.js';
import { inventoryService } from '../inventory/inventory.service.js';
import type { ActivityAction } from '#shared/config/activity-actions.config.js';

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
    closed: ['shipped', 'partially_shipped', 'approved'],
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
    action: ActivityAction,
    reason: string,
    tx: Transaction,
  ) {
    // Root Serialization Lock: Ensure strictly linear transitions for this order
    await tx
      .select({ id: salesOrders.id })
      .from(salesOrders)
      .where(and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)))
      .for('update');

    const existing = await tx.query.salesOrders.findFirst({
      where: and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)),
      with: {
        lines: {
          with: {
            shipmentLines: {
              where: (sl, { isNull }) => isNull(sl.deletedAt),
              with: {
                shipment: true,
              },
            },
          },
        },
      },
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

    // 2. Inventory Allocation Side-Effects
    if (newStatus === 'approved') {
      // Allocate stock for all lines using a dynamic warehouse sourcing strategy
      for (const line of existing.lines) {
        let remainingToAllocate = Number(line.quantity);

        // Find warehouses with available stock for this product and lock the stock level rows FOR UPDATE
        const stockLevels = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.organizationId, organizationId),
              eq(inventoryLevels.productId, line.productId),
              isNull(inventoryLevels.deletedAt),
            ),
          )
          .orderBy(inventoryLevels.id)
          .for('update');

        for (const il of stockLevels) {
          const available = Number(il.quantityOnHand) - Number(il.quantityAllocated);
          if (available > 0) {
            const toAllocate = Math.min(remainingToAllocate, available);
            await inventoryService.allocateStock(
              organizationId,
              userId,
              line.id,
              line.productId,
              il.warehouseId,
              il.binId,
              toAllocate,
              tx,
            );
            remainingToAllocate -= toAllocate;
          }
          if (remainingToAllocate <= 0) break;
        }

        // If there's still quantity remaining to allocate (stock shortage), allocate to fallback warehouse
        if (remainingToAllocate > 0) {
          let targetWarehouseId: string | undefined;
          let targetBinId: string | null = null;

          const firstStockLevel = stockLevels[0];
          if (firstStockLevel) {
            targetWarehouseId = firstStockLevel.warehouseId;
            targetBinId = firstStockLevel.binId;
          } else {
            // Get first warehouse in the organization as fallback
            const defaultWh = await tx.query.warehouses.findFirst({
              where: (wh, { eq }) => eq(wh.organizationId, organizationId),
            });
            targetWarehouseId = defaultWh?.id;
          }

          if (targetWarehouseId) {
            await inventoryService.allocateStock(
              organizationId,
              userId,
              line.id,
              line.productId,
              targetWarehouseId,
              targetBinId,
              remainingToAllocate,
              tx,
            );
          }
        }
      }
    } else if (
      newStatus === 'cancelled' &&
      (existing.status === 'approved' || existing.status === 'partially_shipped')
    ) {
      // Deallocate remaining stock from the decoupled ledger and physical bins
      for (const line of existing.lines) {
        await inventoryService.deallocateStock(organizationId, userId, line.id, tx);
      }
    }

    // 3. Business Activity Log (Temporal Narrative)
    await ActivityLogger.recordUpdate(
      tx,
      {
        organizationId,
        entityType: 'sales_order',
        entityId: id,
        entityDisplayId: existing.documentNumber,
        entityLabel: 'Sales Order',
        action,
        reason: reason || `Status changed from ${existing.status} to ${newStatus}`,
        userId,
      },
      existing,
      { status: newStatus },
    );

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
    action?: string,
    reason?: string,
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

    // Derive automated reason if none provided
    let autoReason = reason;
    if (!autoReason && newStatus !== so.status) {
      if (newStatus === 'shipped') {
        autoReason =
          so.status === 'partially_shipped'
            ? 'Backorder fulfillment completed: Order fully shipped.'
            : 'Standard fulfillment completed.';
      } else if (newStatus === 'partially_shipped') {
        autoReason =
          so.status === 'partially_shipped'
            ? 'Subsequent partial fulfillment recorded (Backorder remains).'
            : 'Initial partial fulfillment recorded.';
      }
    }

    if (newStatus !== so.status) {
      await this.updateStatus(
        organizationId,
        userId,
        id,
        newStatus,
        (action as ActivityAction) || 'SYSTEM_RECONCILIATION',
        autoReason || reason || 'System reconciliation of fulfillment',
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
        'SYSTEM_RECONCILIATION',
        'System reconciliation of billing',
        tx,
      );
    }
  }
}
