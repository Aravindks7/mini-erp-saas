import { db } from '../../db/index.js';
import {
  shipments,
  shipmentLines,
  inventoryLevels,
  inventoryLedgers,
  salesOrders,
} from '../../db/schema/index.js';
import { sequencesService } from '../sequences/sequences.service.js';
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

      // 4. Update Sales Order status
      await tx
        .update(salesOrders)
        .set(this.withAudit({ status: 'shipped' }, userId, true))
        .where(
          and(
            eq(salesOrders.id, data.salesOrderId),
            eq(salesOrders.organizationId, organizationId),
          ),
        );

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
   * Retrieves a specific shipment by ID.
   */
  async getShipmentById(organizationId: string, id: string) {
    return await db.query.shipments.findFirst({
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
      where: this.getTenantWhere(organizationId),
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
