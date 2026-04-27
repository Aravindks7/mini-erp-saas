import { db } from '../../db/index.js';
import { salesOrders, salesOrderLines } from '../../db/schema/index.js';
import { and, desc, eq } from 'drizzle-orm';
import {
  CreateSalesOrderInput,
  FulfillSalesOrderInput,
} from '#shared/contracts/sales-orders.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { inventoryService } from '../inventory/inventory.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class SalesOrdersService extends BaseService<typeof salesOrders> {
  constructor() {
    super(salesOrders);
  }

  async listSOs(organizationId: string) {
    return await db.query.salesOrders.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        customer: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(salesOrders.createdAt)],
    });
  }

  async getSOById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.salesOrders.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        customer: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
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

      return so;
    });
  }

  async updateSO(organizationId: string, userId: string, id: string, data: CreateSalesOrderInput) {
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

      return { id, status: 'draft' };
    });
  }

  async fulfillSO(
    organizationId: string,
    userId: string,
    id: string,
    data: FulfillSalesOrderInput,
  ) {
    return await db.transaction(async (tx) => {
      const so = await this.getSOById(organizationId, id, tx);
      if (!so) {
        throw new Error('Sales order not found');
      }

      if (so.status === 'shipped') {
        throw new Error('Sales order already shipped');
      }

      if (so.status === 'cancelled') {
        throw new Error('Cannot fulfill a cancelled sales order');
      }

      await tx
        .update(salesOrders)
        .set(this.withAudit({ status: 'shipped' }, userId, true))
        .where(and(eq(salesOrders.id, id), eq(salesOrders.organizationId, organizationId)));

      for (const fulfillLine of data.lines) {
        const soLine = so.lines.find((l) => l.id === fulfillLine.salesOrderLineId);
        if (!soLine) {
          throw new Error(`SO Line ${fulfillLine.salesOrderLineId} not found in this order`);
        }

        // Outtake via Inventory Adjustment (negative quantity)
        await inventoryService.createAdjustment(
          organizationId,
          userId,
          {
            reason: `SO Shipped: ${so.documentNumber}`,
            reference: so.documentNumber,
            lines: [
              {
                productId: soLine.productId,
                warehouseId: fulfillLine.warehouseId,
                binId: fulfillLine.binId,
                quantityChange: `-${fulfillLine.quantityShipped}`,
              },
            ],
          },
          tx,
        );
      }

      return { id, status: 'shipped' };
    });
  }
}

export const salesOrdersService = new SalesOrdersService();
