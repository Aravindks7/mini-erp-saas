import { db } from '../../db/index.js';
import {
  receipts,
  receiptLines,
  inventoryLevels,
  inventoryLedgers,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { sql, desc } from 'drizzle-orm';
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
   * Updates Header -> Lines -> Inventory Levels -> Inventory Ledgers.
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

        // D. (Optional) Update PO Line if applicable
        // This is a placeholder for more complex PO status logic
        // In a real system, we'd track cumulative received quantity.
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
   * Retrieves a specific receipt by ID.
   */
  async getReceiptById(organizationId: string, id: string) {
    return await db.query.receipts.findFirst({
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
      where: this.getTenantWhere(organizationId),
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
