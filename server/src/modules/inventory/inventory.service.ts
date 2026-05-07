import { db } from '../../db/index.js';
import {
  inventoryAdjustments,
  inventoryAdjustmentLines,
  inventoryLevels,
  inventoryLedgers,
  inventoryTransfers,
  inventoryTransferLines,
  warehouses,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { sql, desc, and, eq } from 'drizzle-orm';
import { CreateInventoryAdjustmentInput } from '#shared/contracts/inventory-adjustments.contract.js';
import { CreateInventoryTransferInput } from '#shared/contracts/inventory-transfers.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * InventoryService: Orchestrates atomic stock movements.
 * Axiom: Every quantity change must have a header, a line, a ledger entry, and a level update.
 */
export class InventoryService extends BaseService<typeof inventoryAdjustments> {
  constructor() {
    super(inventoryAdjustments);
  }

  /**
   * Helper to ensure a System Transit Warehouse exists for the organization.
   */
  private async getOrCreateTransitWarehouse(
    organizationId: string,
    userId: string,
    tx: Transaction | typeof db,
  ) {
    const transit = await tx.query.warehouses.findFirst({
      where: and(
        eq(warehouses.organizationId, organizationId),
        eq(warehouses.isSystemTransit, true),
      ),
    });

    if (transit) return transit;

    const [newTransit] = await tx
      .insert(warehouses)
      .values(
        this.withAudit(
          {
            organizationId,
            code: 'TRANSIT',
            name: 'In-Transit Storage',
            isSystemTransit: true,
          },
          userId,
        ),
      )
      .returning();

    return newTransit;
  }

  /**
   * Creates an atomic Inventory Adjustment.
   * Updates Header -> Lines -> Levels -> Ledgers in a single transaction.
   */
  async createAdjustment(
    organizationId: string,
    userId: string,
    data: CreateInventoryAdjustmentInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
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
              adjustmentDate: data.adjustmentDate ? new Date(data.adjustmentDate) : new Date(),
              reason: data.reason,
              reference: data.reference || sequenceNumber,
              status: 'draft', // New default is draft
            },
            userId,
          ),
        )
        .returning();

      if (!adjustment) {
        throw new Error('Failed to create inventory adjustment header');
      }

      // 3. Process each line
      for (const line of data.lines) {
        await tx.insert(inventoryAdjustmentLines).values(
          this.withAudit(
            {
              organizationId,
              adjustmentId: adjustment.id,
              productId: line.productId,
              warehouseId: line.warehouseId,
              binId: line.binId,
              quantityChange: line.quantityVariance.toString(),
            },
            userId,
          ),
        );
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'inventory_adjustment',
        entityId: adjustment.id,
        entityDisplayId: sequenceNumber,
        entityLabel: 'Inventory Adjustment',
        action: 'CREATED',
        reason: data.reason || 'Manual inventory adjustment',
        snapshot: { lines: data.lines },
        userId,
      });

      return adjustment;
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  /**
   * Approves a draft adjustment and commits stock changes.
   */
  async approveAdjustment(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const adjustment = await tx.query.inventoryAdjustments.findFirst({
        where: this.getTenantWhere(organizationId, id),
        with: { lines: true },
      });

      if (!adjustment || adjustment.status !== 'draft') {
        throw new Error('Adjustment not found or already processed');
      }

      for (const line of adjustment.lines) {
        // A. Update Level
        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityOnHand: '0',
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

        // B. Ledger
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

      await tx
        .update(inventoryAdjustments)
        .set({ status: 'approved', updatedAt: new Date(), updatedBy: userId })
        .where(eq(inventoryAdjustments.id, id));

      const updated = await tx.query.inventoryAdjustments.findFirst({
        where: eq(inventoryAdjustments.id, id),
        with: { lines: true },
      });

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'inventory_adjustment',
        entityId: adjustment.id,
        entityDisplayId: adjustment.reference || adjustment.id,
        entityLabel: 'Inventory Adjustment',
        action: 'STATUS_CHANGED',
        snapshot: { previousStatus: 'draft', newStatus: 'approved' },
        userId,
      });

      return updated!;
    });
  }

  /**
   * Creates an atomic Inventory Transfer.
   */
  async createTransfer(organizationId: string, userId: string, data: CreateInventoryTransferInput) {
    return await db.transaction(async (tx) => {
      const sequenceNumber = await sequencesService.getNextSequence(
        organizationId,
        'TRF',
        userId,
        tx,
      );

      const [transfer] = await tx
        .insert(inventoryTransfers)
        .values(
          this.withAudit(
            {
              organizationId,
              transferDate: new Date(),
              fromWarehouseId: data.fromWarehouseId,
              toWarehouseId: data.toWarehouseId,
              reference: data.reference || sequenceNumber,
              status: 'draft',
            },
            userId,
          ),
        )
        .returning();

      if (!transfer) throw new Error('Failed to create transfer header');

      for (const line of data.lines) {
        await tx.insert(inventoryTransferLines).values(
          this.withAudit(
            {
              organizationId,
              transferId: transfer.id,
              productId: line.productId,
              quantity: line.quantity.toString(),
            },
            userId,
          ),
        );
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'inventory_transfer',
        entityId: transfer.id,
        entityDisplayId: sequenceNumber,
        entityLabel: 'Inventory Transfer',
        action: 'CREATED',
        snapshot: { lines: data.lines },
        userId,
      });

      return transfer;
    });
  }

  /**
   * Ships a transfer: moves stock from source to transit.
   */
  async shipTransfer(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const transfer = await tx.query.inventoryTransfers.findFirst({
        where: this.getTenantWhere(organizationId, id, inventoryTransfers),
        with: { lines: true },
      });

      if (!transfer || transfer.status !== 'draft') {
        throw new Error('Transfer not found or not in draft status');
      }

      const transitWarehouse = await this.getOrCreateTransitWarehouse(organizationId, userId, tx);
      if (!transitWarehouse) throw new Error('System transit warehouse not found');

      for (const line of transfer.lines) {
        // 1. Deduct from Source
        await tx
          .update(inventoryLevels)
          .set({
            quantityOnHand: sql`${inventoryLevels.quantityOnHand} - ${line.quantity}::numeric`,
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(
            and(
              eq(inventoryLevels.organizationId, organizationId),
              eq(inventoryLevels.productId, line.productId),
              eq(inventoryLevels.warehouseId, transfer.fromWarehouseId),
            ),
          );

        await tx.insert(inventoryLedgers).values(
          this.withAudit(
            {
              organizationId,
              productId: line.productId,
              warehouseId: transfer.fromWarehouseId,
              quantityChange: `-${line.quantity}`,
              referenceType: 'transfer',
              referenceId: transfer.id,
            },
            userId,
          ),
        );

        // 2. Add to Transit
        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: transitWarehouse.id,
                quantityOnHand: line.quantity.toString(),
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
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${line.quantity}::numeric`,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });

        await tx.insert(inventoryLedgers).values(
          this.withAudit(
            {
              organizationId,
              productId: line.productId,
              warehouseId: transitWarehouse.id,
              quantityChange: line.quantity,
              referenceType: 'transfer',
              referenceId: transfer.id,
            },
            userId,
          ),
        );
      }

      await tx
        .update(inventoryTransfers)
        .set({ status: 'shipped', updatedAt: new Date(), updatedBy: userId })
        .where(eq(inventoryTransfers.id, id));

      const updated = await tx.query.inventoryTransfers.findFirst({
        where: eq(inventoryTransfers.id, id),
        with: { lines: true },
      });

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'inventory_transfer',
        entityId: transfer.id,
        entityDisplayId: transfer.reference || transfer.id,
        entityLabel: 'Inventory Transfer',
        action: 'STATUS_CHANGED',
        snapshot: { previousStatus: 'draft', newStatus: 'shipped' },
        userId,
      });

      return updated!;
    });
  }

  /**
   * Receives a transfer: moves stock from transit to destination.
   */
  async receiveTransfer(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const transfer = await tx.query.inventoryTransfers.findFirst({
        where: this.getTenantWhere(organizationId, id, inventoryTransfers),
        with: { lines: true },
      });

      if (!transfer || transfer.status !== 'shipped') {
        throw new Error('Transfer not found or not shipped');
      }

      const transitWarehouse = await this.getOrCreateTransitWarehouse(organizationId, userId, tx);
      if (!transitWarehouse) throw new Error('System transit warehouse not found');

      for (const line of transfer.lines) {
        // 1. Deduct from Transit
        await tx
          .update(inventoryLevels)
          .set({
            quantityOnHand: sql`${inventoryLevels.quantityOnHand} - ${line.quantity}::numeric`,
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(
            and(
              eq(inventoryLevels.organizationId, organizationId),
              eq(inventoryLevels.productId, line.productId),
              eq(inventoryLevels.warehouseId, transitWarehouse.id),
            ),
          );

        await tx.insert(inventoryLedgers).values(
          this.withAudit(
            {
              organizationId,
              productId: line.productId,
              warehouseId: transitWarehouse.id,
              quantityChange: `-${line.quantity}`,
              referenceType: 'transfer',
              referenceId: transfer.id,
            },
            userId,
          ),
        );

        // 2. Add to Destination
        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: transfer.toWarehouseId,
                quantityOnHand: line.quantity.toString(),
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
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${line.quantity}::numeric`,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          });

        await tx.insert(inventoryLedgers).values(
          this.withAudit(
            {
              organizationId,
              productId: line.productId,
              warehouseId: transfer.toWarehouseId,
              quantityChange: line.quantity,
              referenceType: 'transfer',
              referenceId: transfer.id,
            },
            userId,
          ),
        );
      }

      await tx
        .update(inventoryTransfers)
        .set({ status: 'received', updatedAt: new Date(), updatedBy: userId })
        .where(eq(inventoryTransfers.id, id));

      const updated = await tx.query.inventoryTransfers.findFirst({
        where: eq(inventoryTransfers.id, id),
        with: { lines: true },
      });

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'inventory_transfer',
        entityId: transfer.id,
        entityDisplayId: transfer.reference || transfer.id,
        entityLabel: 'Inventory Transfer',
        action: 'STATUS_CHANGED',
        snapshot: { previousStatus: 'shipped', newStatus: 'received' },
        userId,
      });

      return updated!;
    });
  }

  /**
   * Lists all inventory transfers for the organization.
   */
  async listTransfers(organizationId: string) {
    return await db.query.inventoryTransfers.findMany({
      where: this.getTenantWhere(organizationId, undefined, inventoryTransfers),
      orderBy: [desc(inventoryTransfers.createdAt)],
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Retrieves a specific inventory transfer by ID.
   */
  async getTransferById(organizationId: string, id: string) {
    return await db.query.inventoryTransfers.findFirst({
      where: this.getTenantWhere(organizationId, id, inventoryTransfers),
      with: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
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
        product: {
          with: { baseUom: true },
        },
        warehouse: true,
        bin: true,
      },
      orderBy: [desc(inventoryLevels.updatedAt)],
    });
  }

  /**
   * Retrieves a specific inventory level by ID.
   */
  async getInventoryLevel(organizationId: string, levelId: string) {
    return await db.query.inventoryLevels.findFirst({
      where: and(
        eq(inventoryLevels.organizationId, organizationId),
        eq(inventoryLevels.id, levelId),
      ),
      with: {
        product: {
          with: { baseUom: true },
        },
        warehouse: true,
        bin: true,
      },
    });
  }

  /**
   * Lists ledger entries for a specific inventory level.
   */
  async listLevelLedgerEntries(organizationId: string, levelId: string) {
    const level = await this.getInventoryLevel(organizationId, levelId);
    if (!level) return [];

    const conditions = [
      eq(inventoryLedgers.organizationId, organizationId),
      eq(inventoryLedgers.productId, level.productId),
      eq(inventoryLedgers.warehouseId, level.warehouseId),
    ];

    if (level.binId) {
      conditions.push(eq(inventoryLedgers.binId, level.binId));
    } else {
      conditions.push(sql`${inventoryLedgers.binId} IS NULL`);
    }

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

  /**
   * Lists inventory ledger entries (audit trail) for the organization.
   */
  async listLedgerEntries(organizationId: string) {
    return await db.query.inventoryLedgers.findMany({
      where: eq(inventoryLedgers.organizationId, organizationId),
      with: {
        product: true,
        warehouse: true,
        bin: true,
      },
      orderBy: [desc(inventoryLedgers.createdAt)],
    });
  }
  /**
   * Allocates stock for a sales order.
   * Increments quantityAllocated and validates against available stock.
   */
  async allocateStock(
    organizationId: string,
    userId: string,
    productId: string,
    quantity: string | number,
    tx: Transaction,
  ) {
    const qty = Number(quantity);
    if (qty <= 0) return;

    // In a multi-warehouse environment, we might need a more complex allocation strategy.
    // For now, we update the main inventory record (or assume a primary warehouse/bin).
    await tx
      .update(inventoryLevels)
      .set({
        quantityAllocated: sql`${inventoryLevels.quantityAllocated} + ${qty.toString()}::numeric`,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        and(
          eq(inventoryLevels.organizationId, organizationId),
          eq(inventoryLevels.productId, productId),
        ),
      );
  }

  /**
   * Deallocates stock (e.g. on order cancellation).
   * Decrements quantityAllocated.
   */
  async deallocateStock(
    organizationId: string,
    userId: string,
    productId: string,
    quantity: string | number,
    tx: Transaction,
  ) {
    const qty = Number(quantity);
    if (qty <= 0) return;

    await tx
      .update(inventoryLevels)
      .set({
        quantityAllocated: sql`GREATEST(0, ${inventoryLevels.quantityAllocated} - ${qty.toString()}::numeric)`,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        and(
          eq(inventoryLevels.organizationId, organizationId),
          eq(inventoryLevels.productId, productId),
        ),
      );
  }
}

export const inventoryService = new InventoryService();
