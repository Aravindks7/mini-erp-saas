import { db } from '../../db/index.js';
import { purchaseOrders, purchaseOrderLines } from '../../db/schema/index.js';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { CreatePurchaseOrderInput } from '#shared/contracts/purchase-orders.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';

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
   * Updates the status of a Purchase Order.
   */
  async updatePOStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled',
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      const [updated] = await tx
        .update(purchaseOrders)
        .set(this.withAudit({ status }, userId, true))
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)))
        .returning();

      if (!updated) {
        throw new Error('Purchase order not found or update failed');
      }
      return updated;
    };

    if (txIn) return await operation(txIn);
    return await db.transaction(operation);
  }

  /**
   * Deletes a single draft Purchase Order.
   */
  async deletePO(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const po = await this.getPOById(organizationId, id, tx);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== 'draft') {
        throw new Error('Only draft purchase orders can be deleted');
      }

      const [deleted] = await tx
        .update(purchaseOrders)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.organizationId, organizationId)))
        .returning();

      return deleted;
    });
  }

  /**
   * Bulk deletes draft Purchase Orders.
   */
  async bulkDeletePOs(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const posToDelete = await tx.query.purchaseOrders.findMany({
        where: and(
          inArray(purchaseOrders.id, ids),
          eq(purchaseOrders.organizationId, organizationId),
        ),
      });

      const nonDraft = posToDelete.find((po) => po.status !== 'draft');
      if (nonDraft) {
        throw new Error(
          `Cannot delete PO ${nonDraft.documentNumber} because it is not in draft status`,
        );
      }

      const deletedPOs = await tx
        .update(purchaseOrders)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(
          and(eq(purchaseOrders.organizationId, organizationId), inArray(purchaseOrders.id, ids)),
        )
        .returning();

      return deletedPOs;
    });
  }
}

export const purchaseOrdersService = new PurchaseOrdersService();
