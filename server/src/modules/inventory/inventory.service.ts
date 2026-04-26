import { db } from '../../db/index.js';
import {
  inventoryAdjustments,
  inventoryAdjustmentLines,
  inventoryLevels,
  inventoryLedgers,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { sql, desc, and, eq } from 'drizzle-orm';
import { CreateAdjustmentInput } from '#shared/contracts/inventory.contract.js';
import { BaseService } from '../../lib/base.service.js';

/**
 * InventoryService: Orchestrates atomic stock movements.
 * Axiom: Every quantity change must have a header, a line, a ledger entry, and a level update.
 */
export class InventoryService extends BaseService<typeof inventoryAdjustments> {
  constructor() {
    super(inventoryAdjustments);
  }

  /**
   * Creates an atomic Inventory Adjustment.
   * Updates Header -> Lines -> Levels -> Ledgers in a single transaction.
   */
  async createAdjustment(organizationId: string, userId: string, data: CreateAdjustmentInput) {
    return await db.transaction(async (tx) => {
      // 1. Generate Sequence Number (e.g., ADJ-0001)
      const sequenceNumber = await sequencesService.getNextSequence(
        organizationId,
        'ADJ',
        userId,
        tx,
      );

      // 2. Create Adjustment Header
      const [adjustment] = await tx
        .insert(inventoryAdjustments)
        .values(
          this.withAudit(
            {
              organizationId,
              adjustmentDate: new Date(),
              reason: data.reason,
              reference: data.reference || sequenceNumber,
              status: 'approved', // Adjustments are auto-approved for this iteration
            },
            userId,
          ),
        )
        .returning();

      if (!adjustment) {
        throw new Error('Failed to create inventory adjustment header');
      }

      // 3. Process each line atomically
      for (const line of data.lines) {
        // A. Insert Line Detail
        await tx.insert(inventoryAdjustmentLines).values(
          this.withAudit(
            {
              organizationId,
              adjustmentId: adjustment.id,
              productId: line.productId,
              warehouseId: line.warehouseId,
              binId: line.binId,
              quantityChange: line.quantityChange,
            },
            userId,
          ),
        );

        // B. Update Inventory Level (UPSERT)
        // Axiom: We use sql`quantity_on_hand + change` for atomic increments.
        // Postgres check constraints will prevent quantityOnHand from falling below zero.
        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityOnHand: line.quantityChange,
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
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${line.quantityChange}::numeric`,
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
              quantityChange: line.quantityChange,
              referenceType: 'adjustment',
              referenceId: adjustment.id,
            },
            userId,
          ),
        );
      }

      return adjustment;
    });
  }

  /**
   * Retrieves a specific inventory adjustment by ID.
   */
  async getAdjustmentById(organizationId: string, id: string) {
    return await db.query.inventoryAdjustments.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
      },
    });
  }

  /**
   * Lists all inventory adjustments for the organization.
   */
  async listAdjustments(organizationId: string) {
    return await db.query.inventoryAdjustments.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: [desc(inventoryAdjustments.createdAt)],
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
      },
    });
  }

  /**
   * Lists real-time inventory levels across all sites.
   */
  async listInventoryLevels(organizationId: string) {
    return await db.query.inventoryLevels.findMany({
      where: and(
        eq(inventoryLevels.organizationId, organizationId),
        sql`${inventoryLevels.deletedAt} IS NULL`,
      ),
      with: {
        product: true,
        warehouse: true,
        bin: true,
      },
      orderBy: [desc(inventoryLevels.updatedAt)],
    });
  }

  /**
   * Lists inventory ledger entries (audit trail) with optional filtering.
   */
  async listLedgerEntries(
    organizationId: string,
    filters: { productId?: string; warehouseId?: string; binId?: string } = {},
  ) {
    const conditions = [eq(inventoryLedgers.organizationId, organizationId)];

    if (filters.productId) conditions.push(eq(inventoryLedgers.productId, filters.productId));
    if (filters.warehouseId) conditions.push(eq(inventoryLedgers.warehouseId, filters.warehouseId));
    if (filters.binId) conditions.push(eq(inventoryLedgers.binId, filters.binId));

    return await db.query.inventoryLedgers.findMany({
      where: and(...conditions),
      with: {
        product: true,
        warehouse: true,
        bin: true,
      },
      orderBy: [desc(inventoryLedgers.createdAt)],
    });
  }
}

export const inventoryService = new InventoryService();
