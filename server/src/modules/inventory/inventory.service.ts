import { db } from '../../db/index.js';
import {
  inventoryAdjustments,
  inventoryAdjustmentLines,
  inventoryLevels,
  inventoryLedgers,
  inventoryTransfers,
  inventoryTransferLines,
  warehouses,
  inventoryAllocations,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { and, eq, sql, desc } from 'drizzle-orm';
import {
  CreateInventoryAdjustmentInput,
  UpdateInventoryAdjustmentInput,
} from '#shared/contracts/inventory-adjustments.contract.js';
import {
  CreateInventoryTransferInput,
  UpdateInventoryTransferInput,
} from '#shared/contracts/inventory-transfers.contract.js';
import { logger } from '../../utils/logger.js';
import { ActivityLogger } from '../../lib/activity-logger.js';
import { BaseService } from '../../lib/base.service.js';

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

      return await this.getAdjustmentById(organizationId, adjustment.id, tx);
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  async updateAdjustment(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateInventoryAdjustmentInput,
  ) {
    return await db.transaction(async (tx) => {
      const existing = await this.getAdjustmentById(organizationId, id, tx);
      if (!existing) throw new Error('Adjustment not found');

      if (existing.status !== 'draft') {
        throw new Error('Only draft adjustments can be modified.');
      }

      const { lines, ...headerData } = data;

      // Update Header
      if (Object.keys(headerData).length > 0) {
        const headerToUpdate = {
          ...headerData,
          adjustmentDate: headerData.adjustmentDate
            ? new Date(headerData.adjustmentDate)
            : undefined,
        };

        await tx
          .update(inventoryAdjustments)
          .set(this.withAudit(headerToUpdate, userId, true))
          .where(
            and(
              eq(inventoryAdjustments.id, id),
              eq(inventoryAdjustments.organizationId, organizationId),
            ),
          );
      }

      // Replace Lines if provided
      if (lines) {
        await tx
          .delete(inventoryAdjustmentLines)
          .where(
            and(
              eq(inventoryAdjustmentLines.adjustmentId, id),
              eq(inventoryAdjustmentLines.organizationId, organizationId),
            ),
          );

        for (const line of lines) {
          await tx.insert(inventoryAdjustmentLines).values(
            this.withAudit(
              {
                organizationId,
                adjustmentId: id,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityChange: line.quantityVariance.toString(),
              },
              userId,
            ),
          );
        }
      }

      // Record Update
      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_adjustment',
          entityId: id,
          entityDisplayId: existing.reference || id,
          entityLabel: 'Inventory Adjustment',
          action: 'UPDATED',
        },
        existing,
        data as Record<string, unknown>,
      );

      return await this.getAdjustmentById(organizationId, id, tx);
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
        logger.info(
          {
            adjustmentId: id,
            productId: line.productId,
            quantityChange: line.quantityChange,
            warehouseId: line.warehouseId,
          },
          'Committing inventory adjustment line',
        );

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

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_adjustment',
          entityId: id,
          entityDisplayId: adjustment.reference || id,
          entityLabel: 'Inventory Adjustment',
          action: 'STATUS_CHANGED',
          reason: 'Adjustment approved and stock committed',
        },
        adjustment,
        { status: 'approved' },
      );

      return updated!;
    });
  }

  /**
   * Cancels a draft adjustment.
   */
  async cancelAdjustment(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const adjustment = await tx.query.inventoryAdjustments.findFirst({
        where: this.getTenantWhere(organizationId, id),
      });

      if (!adjustment || adjustment.status !== 'draft') {
        throw new Error('Adjustment not found or cannot be cancelled');
      }

      await tx
        .update(inventoryAdjustments)
        .set({ status: 'cancelled', updatedAt: new Date(), updatedBy: userId })
        .where(eq(inventoryAdjustments.id, id));

      const updated = await tx.query.inventoryAdjustments.findFirst({
        where: eq(inventoryAdjustments.id, id),
        with: { lines: true },
      });

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_adjustment',
          entityId: id,
          entityDisplayId: adjustment.reference || id,
          entityLabel: 'Inventory Adjustment',
          action: 'STATUS_CHANGED',
          reason: 'Adjustment cancelled',
        },
        adjustment,
        { status: 'cancelled' },
      );

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
        action: 'INVENTORY_TRANSFER_CREATED',
        snapshot: { lines: data.lines },
        userId,
      });

      return await this.getTransferById(organizationId, transfer.id, tx);
    });
  }

  async updateTransfer(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateInventoryTransferInput,
  ) {
    return await db.transaction(async (tx) => {
      const existing = await this.getTransferById(organizationId, id, tx);
      if (!existing) throw new Error('Transfer not found');

      if (existing.status !== 'draft') {
        throw new Error('Only draft transfers can be modified.');
      }

      const { lines, ...headerData } = data;

      // Update Header
      if (Object.keys(headerData).length > 0) {
        const headerToUpdate = {
          ...headerData,
          transferDate: headerData.transferDate ? new Date(headerData.transferDate) : undefined,
        };

        await tx
          .update(inventoryTransfers)
          .set(this.withAudit(headerToUpdate, userId, true))
          .where(
            and(
              eq(inventoryTransfers.id, id),
              eq(inventoryTransfers.organizationId, organizationId),
            ),
          );
      }

      // Replace Lines if provided
      if (lines) {
        await tx
          .delete(inventoryTransferLines)
          .where(
            and(
              eq(inventoryTransferLines.transferId, id),
              eq(inventoryTransferLines.organizationId, organizationId),
            ),
          );

        for (const line of lines) {
          await tx.insert(inventoryTransferLines).values(
            this.withAudit(
              {
                organizationId,
                transferId: id,
                productId: line.productId,
                quantity: line.quantity.toString(),
              },
              userId,
            ),
          );
        }
      }

      // Record Update
      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_transfer',
          entityId: id,
          entityDisplayId: existing.reference || id,
          entityLabel: 'Inventory Transfer',
          action: 'UPDATED',
        },
        existing,
        data as Record<string, unknown>,
      );

      return await this.getTransferById(organizationId, id, tx);
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

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_transfer',
          entityId: id,
          entityDisplayId: transfer.reference || id,
          entityLabel: 'Inventory Transfer',
          action: 'STATUS_CHANGED',
          reason: 'Transfer shipped: stock moved to transit',
        },
        transfer,
        { status: 'shipped' },
      );

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

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'inventory_transfer',
          entityId: id,
          entityDisplayId: transfer.reference || id,
          entityLabel: 'Inventory Transfer',
          action: 'STATUS_CHANGED',
          reason: 'Transfer received: stock moved from transit to destination',
        },
        transfer,
        { status: 'received' },
      );

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
  async getTransferById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.inventoryTransfers.findFirst({
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
  async getAdjustmentById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.inventoryAdjustments.findFirst({
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
   * Allocates stock for a sales order line.
   * Increments quantityAllocated on the physical warehouse/bin inventory level,
   * and records the allocation in the decoupled inventory_allocations ledger.
   */
  async allocateStock(
    organizationId: string,
    userId: string,
    salesOrderLineId: string,
    productId: string,
    warehouseId: string,
    binId: string | null,
    quantity: string | number,
    tx: Transaction,
  ) {
    const qty = Number(quantity);
    if (qty <= 0) return;

    const qtyStr = qty.toString();

    // A. Update physical stock allocation in inventory_levels (UPSERT)
    await tx
      .insert(inventoryLevels)
      .values({
        organizationId,
        productId,
        warehouseId,
        binId,
        quantityOnHand: '0',
        quantityAllocated: qtyStr,
        createdBy: userId,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: [
          inventoryLevels.organizationId,
          inventoryLevels.productId,
          inventoryLevels.warehouseId,
          inventoryLevels.binId,
        ],
        set: {
          quantityAllocated: sql`${inventoryLevels.quantityAllocated} + ${qtyStr}::numeric`,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

    // B. Write allocation record to dynamic decoupled inventory_allocations (UPSERT)
    await tx
      .insert(inventoryAllocations)
      .values({
        organizationId,
        salesOrderLineId,
        productId,
        warehouseId,
        binId,
        quantityAllocated: qtyStr,
        createdBy: userId,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: [
          inventoryAllocations.organizationId,
          inventoryAllocations.salesOrderLineId,
          inventoryAllocations.warehouseId,
          inventoryAllocations.binId,
        ],
        set: {
          quantityAllocated: sql`${inventoryAllocations.quantityAllocated} + ${qtyStr}::numeric`,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
  }

  /**
   * Deallocates stock for a sales order line (e.g. on order cancellation).
   * Decrements quantityAllocated on the physical warehouse/bin levels,
   * and purges the allocation records from the decoupled ledger.
   */
  async deallocateStock(
    organizationId: string,
    userId: string,
    salesOrderLineId: string,
    tx: Transaction,
  ) {
    // 1. Fetch all active allocations for the sales order line
    const allocations = await tx.query.inventoryAllocations.findMany({
      where: (alloc, { and, eq }) =>
        and(eq(alloc.organizationId, organizationId), eq(alloc.salesOrderLineId, salesOrderLineId)),
    });

    for (const alloc of allocations) {
      const qtyStr = alloc.quantityAllocated;

      // A. Decrement physical stock allocation in inventory_levels
      await tx
        .update(inventoryLevels)
        .set({
          quantityAllocated: sql`GREATEST(0, ${inventoryLevels.quantityAllocated} - ${qtyStr}::numeric)`,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(
          and(
            eq(inventoryLevels.organizationId, organizationId),
            eq(inventoryLevels.productId, alloc.productId),
            eq(inventoryLevels.warehouseId, alloc.warehouseId),
            alloc.binId
              ? eq(inventoryLevels.binId, alloc.binId)
              : sql`${inventoryLevels.binId} IS NULL`,
          ),
        );
    }

    // B. Delete the allocations from the decoupled ledger
    await tx
      .delete(inventoryAllocations)
      .where(
        and(
          eq(inventoryAllocations.organizationId, organizationId),
          eq(inventoryAllocations.salesOrderLineId, salesOrderLineId),
        ),
      );
  }
}

export const inventoryService = new InventoryService();
