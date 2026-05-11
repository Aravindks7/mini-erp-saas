import { db } from '../../db/index.js';
import { salesOrders, salesOrderLines } from '../../db/schema/index.js';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from '#shared/contracts/sales-orders.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

import { SalesOrderReconciler, SOStatus } from './sales-orders.reconciler.js';
import type { ActivityAction } from '#shared/config/activity-actions.config.js';

export type { SOStatus };

export class SalesOrdersService extends BaseService<typeof salesOrders> {
  constructor() {
    super(salesOrders);
  }

  async listSOs(organizationId: string) {
    const results = await db.query.salesOrders.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        customer: true,
        lines: {
          with: {
            product: true,
          },
        },
        shipments: {
          where: (shipments, { and, isNull, ne }) =>
            and(isNull(shipments.deletedAt), ne(shipments.status, 'cancelled')),
          with: {
            lines: true,
          },
        },
      },
      orderBy: [desc(salesOrders.createdAt)],
    });

    return results.map((so) => {
      const shippedMap: Record<string, number> = {};
      for (const shipment of so.shipments || []) {
        for (const line of shipment.lines || []) {
          if (line.salesOrderLineId) {
            shippedMap[line.salesOrderLineId] =
              (shippedMap[line.salesOrderLineId] || 0) + Number(line.quantityShipped);
          }
        }
      }

      return {
        ...so,
        lines: (so.lines || []).map((line) => ({
          ...line,
          quantityShipped: (shippedMap[line.id] || 0).toString(),
        })),
      };
    });
  }

  async getSOById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    const so = await tx.query.salesOrders.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        customer: true,
        lines: {
          with: {
            product: true,
          },
        },
        shipments: {
          where: (shipments, { and, isNull, ne }) =>
            and(isNull(shipments.deletedAt), ne(shipments.status, 'cancelled')),
          with: {
            lines: true,
          },
        },
      },
    });

    if (!so) return null;

    // Calculate shipped quantity per line
    const shippedMap: Record<string, number> = {};
    for (const shipment of so.shipments || []) {
      for (const line of shipment.lines || []) {
        if (line.salesOrderLineId) {
          shippedMap[line.salesOrderLineId] =
            (shippedMap[line.salesOrderLineId] || 0) + Number(line.quantityShipped);
        }
      }
    }

    return {
      ...so,
      lines: (so.lines || []).map((line) => ({
        ...line,
        quantityShipped: (shippedMap[line.id] || 0).toString(),
      })),
    };
  }

  async createSO(organizationId: string, userId: string, data: CreateSalesOrderInput) {
    return await db.transaction(async (tx) => {
      const documentNumber = await sequencesService.getNextSequence(
        organizationId,
        'SO',
        userId,
        tx,
      );

      const totalAmount = data.lines.reduce((acc, line) => {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount);
        return acc + lineTotal;
      }, 0);

      const [so] = await tx
        .insert(salesOrders)
        .values(
          this.withAudit(
            {
              organizationId,
              customerId: data.customerId,
              documentNumber,
              status: 'draft',
              totalAmount: totalAmount.toString(),
            },
            userId,
          ),
        )
        .returning();

      if (!so) {
        throw new Error('Failed to create sales order');
      }

      for (const line of data.lines) {
        await tx.insert(salesOrderLines).values(
          this.withAudit(
            {
              organizationId,
              salesOrderId: so.id,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRateAtOrder: line.taxRateAtOrder,
              taxAmount: line.taxAmount,
            },
            userId,
          ),
        );
      }

      await ActivityLogger.record(tx, {
        organizationId,
        entityType: 'sales_order',
        entityId: so.id,
        entityDisplayId: so.documentNumber,
        entityLabel: 'Sales Order',
        action: 'ORDER_CREATED',
        reason: 'Initial order creation',
        userId,
      });

      return await this.getSOById(organizationId, so.id, tx);
    });
  }

  async updateSO(organizationId: string, userId: string, id: string, data: UpdateSalesOrderInput) {
    return await db.transaction(async (tx) => {
      const existingSO = await this.getSOById(organizationId, id, tx);
      if (!existingSO) {
        throw new Error('Sales order not found');
      }

      if (existingSO.status !== 'draft') {
        throw new Error('Only draft sales orders can be modified');
      }

      const totalAmount = data.lines.reduce((acc, line) => {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount);
        return acc + lineTotal;
      }, 0);

      await tx
        .update(salesOrders)
        .set(
          this.withAudit(
            {
              customerId: data.customerId,
              totalAmount: totalAmount.toString(),
            },
            userId,
            true,
          ),
        )
        .where(and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)));

      await tx
        .delete(salesOrderLines)
        .where(
          and(
            eq(salesOrderLines.salesOrderId, id),
            eq(salesOrderLines.organizationId, organizationId),
          ),
        );

      for (const line of data.lines) {
        await tx.insert(salesOrderLines).values(
          this.withAudit(
            {
              organizationId,
              salesOrderId: id,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRateAtOrder: line.taxRateAtOrder,
              taxAmount: line.taxAmount,
            },
            userId,
          ),
        );
      }

      await ActivityLogger.recordUpdate(
        tx,
        {
          organizationId,
          entityType: 'sales_order',
          entityId: id,
          entityDisplayId: existingSO.documentNumber,
          entityLabel: 'Sales Order',
          action: 'UPDATED',
          reason: data.reason ?? null,
          userId,
        },
        existingSO,
        {
          customerId: data.customerId,
          totalAmount: totalAmount.toString(),
        },
      );

      return await this.getSOById(organizationId, id, tx);
    });
  }

  /**
   * Updates the status of a Sales Order with transition validation and activity logging.
   */
  async updateSOStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: SOStatus,
    action: ActivityAction,
    reason: string,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      // We pass the transaction cast to `Transaction` to satisfy Drizzle types.
      await SalesOrderReconciler.updateStatus(
        organizationId,
        userId,
        id,
        status,
        action,
        reason,
        tx as Transaction,
      );

      return await this.getSOById(organizationId, id, tx);
    };

    if (txIn) return await operation(txIn);
    return await db.transaction(operation);
  }

  /**
   * Reconciles the fulfillment status of a Sales Order based on linked shipments.
   */
  async reconcileFulfillment(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction | typeof db = db,
    action?: string,
    reason?: string,
  ) {
    await SalesOrderReconciler.reconcileFulfillment(
      organizationId,
      userId,
      id,
      tx as Transaction,
      action,
      reason,
    );
  }

  /**
   * Reconciles the billing status of a Sales Order based on linked invoices.
   */
  async reconcileBilling(
    organizationId: string,
    userId: string,
    id: string,
    tx: Transaction | typeof db = db,
  ) {
    await SalesOrderReconciler.reconcileBilling(organizationId, userId, id, tx as Transaction);
  }

  /**
   * Deletes a single draft Sales Order.
   */
  async deleteSO(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const so = await this.getSOById(organizationId, id, tx);
      if (!so) {
        throw new Error('Sales order not found');
      }

      if (so.status !== 'draft') {
        throw new Error('Only draft sales orders can be deleted');
      }

      const [deleted] = await tx
        .update(salesOrders)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)))
        .returning();

      if (deleted) {
        await ActivityLogger.record(tx, {
          organizationId,
          entityType: 'sales_order',
          entityId: id,
          entityDisplayId: so.documentNumber,
          entityLabel: 'Sales Order',
          action: 'DELETED',
          reason: 'Order manually deleted',
          userId,
        });
      }

      return deleted;
    });
  }

  /**
   * Bulk deletes draft Sales Orders.
   */
  async bulkDeleteSOs(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const sosToDelete = await tx.query.salesOrders.findMany({
        where: and(inArray(salesOrders.id, ids), eq(salesOrders.organizationId, organizationId)),
      });

      const nonDraft = sosToDelete.find((so) => so.status !== 'draft');
      if (nonDraft) {
        throw new Error(
          `Cannot delete SO ${nonDraft.documentNumber} because it is not in draft status`,
        );
      }

      const deletedSOs = await tx
        .update(salesOrders)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(salesOrders.organizationId, organizationId), inArray(salesOrders.id, ids)))
        .returning();

      for (const deleted of deletedSOs) {
        await ActivityLogger.record(tx, {
          organizationId,
          entityType: 'sales_order',
          entityId: deleted.id,
          entityDisplayId: deleted.documentNumber,
          entityLabel: 'Sales Order',
          action: 'DELETED',
          reason: 'Order deleted via bulk action',
          userId,
        });
      }

      return deletedSOs;
    });
  }
}

export const salesOrdersService = new SalesOrdersService();
