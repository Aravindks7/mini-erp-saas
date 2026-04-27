import { db } from '../../db/index.js';
import { purchaseOrders, purchaseOrderLines } from '../../db/schema/index.js';
import { and, desc, eq } from 'drizzle-orm';
import {
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
} from '#shared/contracts/purchase-orders.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { inventoryService } from '../inventory/inventory.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * PurchaseOrdersService: Orchestrates supplier procurement workflows.
 * Axiom: A PO tracks commitment, and "Receiving" it triggers physical stock intake.
 */
export class PurchaseOrdersService extends BaseService<typeof purchaseOrders> {
  constructor() {
    super(purchaseOrders);
  }

  /**
   * Lists all purchase orders for the organization.
   */
  async listPOs(organizationId: string) {
    return await db.query.purchaseOrders.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        supplier: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(purchaseOrders.createdAt)],
    });
  }

  /**
   * Retrieves a specific purchase order by ID.
   */
  async getPOById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.purchaseOrders.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        supplier: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new Purchase Order in 'draft' status.
   */
  async createPO(organizationId: string, userId: string, data: CreatePurchaseOrderInput) {
    return await db.transaction(async (tx) => {
      // 1. Generate PO Number (e.g., PO-0001)
      const documentNumber = await sequencesService.getNextSequence(
        organizationId,
        'PO',
        userId,
        tx,
      );

      // 2. Insert PO Header
      // Calculate total amount from lines
      const totalAmount = data.lines.reduce((acc, line) => {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount);
        return acc + lineTotal;
      }, 0);

      const [po] = await tx
        .insert(purchaseOrders)
        .values(
          this.withAudit(
            {
              organizationId,
              supplierId: data.supplierId,
              documentNumber,
              status: 'draft',
              totalAmount: totalAmount.toString(),
            },
            userId,
          ),
        )
        .returning();

      if (!po) {
        throw new Error('Failed to create purchase order');
      }

      // 3. Insert PO Lines
      for (const line of data.lines) {
        await tx.insert(purchaseOrderLines).values(
          this.withAudit(
            {
              organizationId,
              purchaseOrderId: po.id,
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

      return po;
    });
  }

  /**
   * Updates an existing Purchase Order.
   * Axiom: Only 'draft' orders can be modified to maintain audit integrity.
   */
  async updatePO(
    organizationId: string,
    userId: string,
    id: string,
    data: CreatePurchaseOrderInput,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Verify existence and status
      const existingPO = await this.getPOById(organizationId, id, tx);
      if (!existingPO) {
        throw new Error('Purchase order not found');
      }

      if (existingPO.status !== 'draft') {
        throw new Error('Only draft purchase orders can be modified');
      }

      // 2. Calculate new total amount
      const totalAmount = data.lines.reduce((acc, line) => {
        const lineTotal = Number(line.quantity) * Number(line.unitPrice) + Number(line.taxAmount);
        return acc + lineTotal;
      }, 0);

      // 3. Update PO Header
      await tx
        .update(purchaseOrders)
        .set(
          this.withAudit(
            {
              supplierId: data.supplierId,
              totalAmount: totalAmount.toString(),
            },
            userId,
            true,
          ),
        )
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)));

      // 4. Update Lines (Replace strategy for simplicity in MVP)
      await tx
        .delete(purchaseOrderLines)
        .where(
          and(
            eq(purchaseOrderLines.purchaseOrderId, id),
            eq(purchaseOrderLines.organizationId, organizationId),
          ),
        );

      for (const line of data.lines) {
        await tx.insert(purchaseOrderLines).values(
          this.withAudit(
            {
              organizationId,
              purchaseOrderId: id,
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

  /**
   * Atomic Receipt Workflow: Intakes stock and marks PO as received.
   * Orchestrates across PurchaseOrders and Inventory modules.
   */
  async receivePO(
    organizationId: string,
    userId: string,
    id: string,
    data: ReceivePurchaseOrderInput,
  ) {
    return await db.transaction(async (tx) => {
      // 1. Get PO with lines for validation
      const po = await this.getPOById(organizationId, id, tx);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status === 'received') {
        throw new Error('Purchase order already received');
      }

      if (po.status === 'cancelled') {
        throw new Error('Cannot receive a cancelled purchase order');
      }

      // 2. Update status to received
      await tx
        .update(purchaseOrders)
        .set(this.withAudit({ status: 'received' }, userId, true))
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)));

      // 3. Process each receive line to intake stock
      for (const receiveLine of data.lines) {
        const poLine = po.lines.find((l) => l.id === receiveLine.purchaseOrderLineId);
        if (!poLine) {
          throw new Error(`PO Line ${receiveLine.purchaseOrderLineId} not found in this order`);
        }

        // Intake via Inventory Adjustment
        await inventoryService.createAdjustment(
          organizationId,
          userId,
          {
            reason: `PO Received: ${po.documentNumber}`,
            reference: po.documentNumber,
            lines: [
              {
                productId: poLine.productId,
                warehouseId: receiveLine.warehouseId,
                binId: receiveLine.binId,
                quantityChange: receiveLine.quantityReceived,
              },
            ],
          },
          tx,
        );
      }

      return { id, status: 'received' };
    });
  }
}

export const purchaseOrdersService = new PurchaseOrdersService();
