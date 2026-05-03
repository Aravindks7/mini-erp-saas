import { db } from '../../db/index.js';
import {
  shipments,
  shipmentLines,
  inventoryLevels,
  inventoryLedgers,
  salesOrderLines,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { salesOrdersService } from '../sales-orders/sales-orders.service.js';
import { sql, desc, and, eq } from 'drizzle-orm';
import { CreateShipmentInput } from '#shared/contracts/shipments.contract.js';
import { BaseService } from '../../lib/base.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * ShipmentsService: Orchestrates outbound logistics and stock fulfillment.
 * Axiom: Every shipment must atomically update inventory and audit trails.
 */
export class ShipmentsService extends BaseService<typeof shipments> {
  constructor() {
    super(shipments);
  }

  /**
   * Creates an atomic Shipment.
   * Updates Header -> Lines -> Inventory Levels -> Inventory Ledgers -> Sales Order Status.
   */
  async createShipment(
    organizationId: string,
    userId: string,
    data: CreateShipmentInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      // 1. Generate Sequence Number (e.g., SHP-0001)
      const shipmentNumber = await sequencesService.getNextSequence(
        organizationId,
        'SHP',
        userId,
        tx,
      );

      // 2. Create Shipment Header
      const [shipment] = await tx
        .insert(shipments)
        .values(
          this.withAudit(
            {
              organizationId,
              salesOrderId: data.salesOrderId,
              shipmentNumber,
              shipmentDate: data.shipmentDate ? new Date(data.shipmentDate) : new Date(),
              reference: data.reference,
              status: 'shipped',
            },
            userId,
          ),
        )
        .returning();

      if (!shipment) {
        throw new Error('Failed to create shipment header');
      }

      // 3. Process each line atomically
      for (const line of data.lines) {
        // A. Insert Shipment Line
        await tx.insert(shipmentLines).values(
          this.withAudit(
            {
              organizationId,
              shipmentId: shipment.id,
              productId: line.productId,
              warehouseId: line.warehouseId,
              binId: line.binId,
              salesOrderLineId: line.salesOrderLineId,
              quantityShipped: line.quantityShipped.toString(),
            },
            userId,
          ),
        );

        // B. Update Inventory Level (UPSERT)
        // Note: For shipments, we use a negative quantity to reduce stock.
        const quantityChange = `-${line.quantityShipped}`;

        await tx
          .insert(inventoryLevels)
          .values(
            this.withAudit(
              {
                organizationId,
                productId: line.productId,
                warehouseId: line.warehouseId,
                binId: line.binId,
                quantityOnHand: quantityChange,
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
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${quantityChange}::numeric`,
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
              quantityChange: quantityChange,
              referenceType: 'so_shipment',
              referenceId: shipment.id,
            },
            userId,
          ),
        );
      }

      // 4. Reconcile SO Status
      if (data.salesOrderId) {
        await this.reconcileSOStatus(organizationId, userId, data.salesOrderId, tx);
      }

      return shipment;
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  /**
   * Refactor deleteShipment to implement a deletion router.
   * If 'draft': Soft-delete only.
   * If not 'draft': Reverse inventory and transition to 'cancelled'.
   */
  async deleteShipment(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const shipment = await this.getShipmentById(organizationId, id, tx);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status === 'draft') {
        // 1. Draft Path: Soft-delete only
        await tx
          .update(shipments)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(eq(shipments.id, id), eq(shipments.organizationId, organizationId)));

        return { action: 'deleted' };
      } else {
        // 2. Committed Path: Inventory Reversal + Status Void (No soft delete)

        // Reverse Inventory Changes for each line
        for (const line of shipment.lines) {
          // A. Increment Inventory Level (adding back what was shipped)
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${line.quantityShipped}::numeric`,
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
                quantityChange: line.quantityShipped, // Positive change to restore stock
                referenceType: 'so_shipment',
                referenceId: shipment.id,
                notes: 'Shipment Void Reversal',
              },
              userId,
            ),
          );
        }

        // Transition status to cancelled instead of soft deleting
        await tx
          .update(shipments)
          .set(this.withAudit({ status: 'cancelled' }, userId, true))
          .where(and(eq(shipments.id, id), eq(shipments.organizationId, organizationId)));

        // Reconcile SO Status
        if (shipment.salesOrderId) {
          await this.reconcileSOStatus(organizationId, userId, shipment.salesOrderId, tx);
        }

        return { action: 'voided' };
      }
    });
  }

  /**
   * Bulk deletes shipments.
   */
  async bulkDeleteShipments(organizationId: string, userId: string, ids: string[]) {
    for (const id of ids) {
      await this.deleteShipment(organizationId, userId, id);
    }
    return true;
  }

  /**
   * Calculates total shipped quantity vs ordered quantity and updates SO status.
   */
  private async reconcileSOStatus(
    organizationId: string,
    userId: string,
    soId: string,
    tx: Transaction | typeof db,
  ) {
    // 1. Get SO Lines (Expected)
    const soLines = await tx.query.salesOrderLines.findMany({
      where: and(
        eq(salesOrderLines.salesOrderId, soId),
        eq(salesOrderLines.organizationId, organizationId),
      ),
    });

    // 2. Get All Shipments for this SO (Actual)
    const allShipments = await tx.query.shipments.findMany({
      where: and(
        eq(shipments.salesOrderId, soId),
        eq(shipments.organizationId, organizationId),
        sql`${shipments.deletedAt} IS NULL`,
        sql`${shipments.status} != 'cancelled'`,
      ),
      with: {
        lines: true,
      },
    });

    // 3. Aggregate shipped quantities by SO Line ID
    const shippedMap: Record<string, number> = {};
    for (const shipment of allShipments) {
      for (const line of shipment.lines) {
        if (line.salesOrderLineId) {
          shippedMap[line.salesOrderLineId] =
            (shippedMap[line.salesOrderLineId] || 0) + Number(line.quantityShipped);
        }
      }
    }

    // 4. Compare
    let anyShipped = false;
    let allShipped = true;

    for (const soLine of soLines) {
      const shipped = shippedMap[soLine.id] || 0;
      const ordered = Number(soLine.quantity);

      if (shipped > 0) anyShipped = true;
      if (shipped < ordered) allShipped = false;
    }

    // 5. Update Status
    let newStatus: 'approved' | 'partially_shipped' | 'shipped' = 'approved';
    if (allShipped && soLines.length > 0) {
      newStatus = 'shipped';
    } else if (anyShipped) {
      newStatus = 'partially_shipped';
    }

    await salesOrdersService.updateSOStatus(organizationId, userId, soId, newStatus, tx);
  }

  /**
   * Retrieves a specific shipment by ID.
   */
  async getShipmentById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.shipments.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
        salesOrder: true,
      },
    });
  }

  /**
   * Lists all shipments for the organization.
   */
  async listShipments(organizationId: string) {
    return await db.query.shipments.findMany({
      where: and(this.getTenantWhere(organizationId), sql`${shipments.deletedAt} IS NULL`),
      orderBy: [desc(shipments.createdAt)],
      with: {
        lines: {
          with: {
            product: true,
            warehouse: true,
            bin: true,
          },
        },
        salesOrder: true,
      },
    });
  }
}

export const shipmentsService = new ShipmentsService();
