import { db } from '../../db/index.js';
import {
  receipts,
  receiptLines,
  inventoryLevels,
  inventoryLedgers,
  purchaseOrderLines,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { purchaseOrdersService } from '../purchase-orders/purchase-orders.service.js';
import { sql, desc, and, eq } from 'drizzle-orm';
import { CreateReceiptInput } from '#shared/contracts/receipts.contract.js';
import { BaseService } from '../../lib/base.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * ReceiptsService: Orchestrates inbound logistics and stock fulfillment.
 * Axiom: Every receipt must atomically update inventory and audit trails.
 */
export class ReceiptsService extends BaseService<typeof receipts> {
  constructor() {
    super(receipts);
  }

  /**
   * Creates an atomic Receipt.
   * Updates Header -> Lines -> Inventory Levels -> Inventory Ledgers -> PO Status.
   */
  async createReceipt(
    organizationId: string,
    userId: string,
    data: CreateReceiptInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      // 1. Generate Sequence Number (e.g., RCT-0001)
      const receiptNumber = await sequencesService.getNextSequence(
        organizationId,
        'RCT',
        userId,
        tx,
      );

      // 2. Create Receipt Header
      const [receipt] = await tx
        .insert(receipts)
        .values(
          this.withAudit(
            {
              organizationId,
              purchaseOrderId: data.purchaseOrderId,
              receiptNumber,
              receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
              reference: data.reference,
              status: 'received',
            },
            userId,
          ),
        )
        .returning();

      if (!receipt) {
        throw new Error('Failed to create receipt header');
      }

      // 3. Process each line atomically
      for (const line of data.lines) {
        // A. Insert Receipt Line
        await tx.insert(receiptLines).values(
          this.withAudit(
            {
              organizationId,
              receiptId: receipt.id,
              productId: line.productId,
              warehouseId: line.warehouseId,
              binId: line.binId,
              purchaseOrderLineId: line.purchaseOrderLineId,
              quantityReceived: line.quantityReceived,
            },
            userId,
          ),
        );

        // B. Update Inventory Level (UPSERT)
        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityOnHand: line.quantityReceived,
              },
              userId,
            ),
          )
          .onConflictDoUpdate({
            target: [
              inventoryLevels.organizationId,
              inventoryLevels.productId,
              inventoryLevels.warehouseId,
              inventoryLevels.binId,
            ],
            set: {
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${line.quantityReceived}::numeric`,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });

        // C. Insert Ledger Entry for Audit Trail
        await tx.insert(inventoryLedgers).values(
          this.withAudit(
            {
              organizationId,
              productId: line.productId,
              warehouseId: line.warehouseId,
              binId: line.binId,
              quantityChange: line.quantityReceived,
              referenceType: 'po_receipt',
              referenceId: receipt.id,
            },
            userId,
          ),
        );
      }

      // 4. Reconcile PO Status
      if (data.purchaseOrderId) {
        await this.reconcilePOStatus(organizationId, userId, data.purchaseOrderId, tx);
      }

      return receipt;
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  /**
   * Refactored Deletion Router:
   * - If 'draft': Soft-delete only.
   * - If not 'draft': Reverse inventory levels, create reversing ledger entries, and transition to 'cancelled'.
   */
  async deleteReceipt(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const receipt = await this.getReceiptById(organizationId, id, tx);
      if (!receipt) {
        throw new Error('Receipt not found');
      }

      if (receipt.status === 'draft') {
        // 1. Draft Path: Soft-delete only
        await tx
          .update(receipts)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(eq(receipts.id, id), eq(receipts.organizationId, organizationId)));

        return { action: 'deleted' };
      } else {
        // 2. Committed Path: Inventory Reversal + Status Void

        for (const line of receipt.lines) {
          // A. Decrement Inventory Level
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} - ${line.quantityReceived}::numeric`,
              updatedAt: new Date(),
              updatedBy: userId,
            })
            .where(
              and(
                eq(inventoryLevels.organizationId, organizationId),
                eq(inventoryLevels.productId, line.productId),
                eq(inventoryLevels.warehouseId, line.warehouseId),
                eq(inventoryLevels.binId, line.binId as string),
              ),
            );

          // B. Insert Reversal Ledger Entry
          await tx.insert(inventoryLedgers).values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityChange: (-Number(line.quantityReceived)).toString(),
                referenceType: 'po_receipt',
                referenceId: receipt.id,
                notes: 'Receipt Void Reversal',
              },
              userId,
            ),
          );
        }

        // Transition status to cancelled
        await tx
          .update(receipts)
          .set(this.withAudit({ status: 'cancelled' }, userId, true))
          .where(and(eq(receipts.id, id), eq(receipts.organizationId, organizationId)));

        if (receipt.purchaseOrderId) {
          await this.reconcilePOStatus(organizationId, userId, receipt.purchaseOrderId, tx);
        }

        return { action: 'voided' };
      }
    });
  }

  /**
   * Bulk deletes receipts.
   */
  async bulkDeleteReceipts(organizationId: string, userId: string, ids: string[]) {
    return await db.transaction(async (tx) => {
      const poIds = new Set<string>();

      for (const id of ids) {
        const receipt = await this.getReceiptById(organizationId, id, tx);
        if (receipt) {
          if (receipt.purchaseOrderId) poIds.add(receipt.purchaseOrderId);
          await this.deleteReceipt(organizationId, userId, id);
        }
      }

      // reconcilePOStatus is called inside deleteReceipt, but just in case of any batching logic needed later:
      // Reconcile once per PO at the end if desired for performance.
      // But deleteReceipt is already atomic per receipt.

      return true;
    });
  }

  /**
   * Calculates total received quantity vs ordered quantity and updates PO status.
   */
  private async reconcilePOStatus(
    organizationId: string,
    userId: string,
    poId: string,
    tx: Transaction | typeof db,
  ) {
    // 1. Get PO Lines (Expected)
    const poLines = await tx.query.purchaseOrderLines.findMany({
      where: and(
        eq(purchaseOrderLines.purchaseOrderId, poId),
        eq(purchaseOrderLines.organizationId, organizationId),
      ),
    });

    // 2. Get All Receipts for this PO (Actual)
    const allReceipts = await tx.query.receipts.findMany({
      where: and(
        eq(receipts.purchaseOrderId, poId),
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
    let newStatus: 'sent' | 'partially_received' | 'received' = 'sent';
    if (allReceived && poLines.length > 0) {
      newStatus = 'received';
    } else if (anyReceived) {
      newStatus = 'partially_received';
    }

    await purchaseOrdersService.updatePOStatus(organizationId, userId, poId, newStatus, tx);
  }

  /**
   * Retrieves a specific receipt by ID.
   */
  async getReceiptById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.receipts.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
        purchaseOrder: true,
      },
    });
  }

  /**
   * Lists all receipts for the organization.
   */
  async listReceipts(organizationId: string) {
    return await db.query.receipts.findMany({
      where: and(this.getTenantWhere(organizationId), sql`${receipts.deletedAt} IS NULL`),
      orderBy: [desc(receipts.createdAt)],
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
        purchaseOrder: true,
      },
    });
  }
}

export const receiptsService = new ReceiptsService();
