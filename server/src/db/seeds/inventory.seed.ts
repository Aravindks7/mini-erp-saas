import { db } from '../index.js';
import {
  inventoryAdjustments,
  inventoryAdjustmentLines,
  inventoryLevels,
  inventoryLedgers,
} from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq, sql } from 'drizzle-orm';

export async function seedInventory() {
  console.log('🌱 Seeding Inventory Adjustments & Levels...');

  const adjustments = [
    {
      id: SEED_DATA.INVENTORY_ADJUSTMENTS.INITIAL_STOCK,
      reference: 'SEED-MAIN-001',
      reason: 'Initial Load - Main Warehouse',
      lines: [
        {
          productId: SEED_DATA.PRODUCTS.WIDGET_A,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_A1,
          quantity: '150',
        },
        {
          productId: SEED_DATA.PRODUCTS.WIDGET_B,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_B1,
          quantity: '300',
        },
        {
          productId: SEED_DATA.PRODUCTS.STEEL_SHEET,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_A1,
          quantity: '50',
        },
        {
          productId: SEED_DATA.PRODUCTS.COPPER_WIRE,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_B1,
          quantity: '20',
        },
      ],
    },
    {
      id: SEED_DATA.INVENTORY_ADJUSTMENTS.ENRICHMENT_STOCK,
      reference: 'SEED-ENRICH-001',
      reason: 'Enrichment Load - Low Stock for Dashboard',
      lines: [
        {
          productId: SEED_DATA.PRODUCTS.INK_CARTRIDGE,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_A1,
          quantity: '4',
        },
        {
          productId: SEED_DATA.PRODUCTS.PACKAGING_BOX,
          warehouseId: SEED_DATA.WAREHOUSES.MAIN,
          binId: SEED_DATA.BINS.MAIN_B1,
          quantity: '8',
        },
      ],
    },
    {
      id: SEED_DATA.INVENTORY_ADJUSTMENTS.INITIAL_STOCK_DC,
      reference: 'SEED-DC-001',
      reason: 'Initial Load - Distribution Center',
      lines: [
        {
          productId: SEED_DATA.PRODUCTS.MICROCHIP_X,
          warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
          binId: SEED_DATA.BINS.DC_RACK_1,
          quantity: '1000',
        },
        {
          productId: SEED_DATA.PRODUCTS.LED_DISPLAY,
          warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
          binId: SEED_DATA.BINS.DC_RACK_2,
          quantity: '500',
        },
        {
          productId: SEED_DATA.PRODUCTS.OFFICE_PAPER,
          warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
          binId: SEED_DATA.BINS.DC_RACK_1,
          quantity: '200',
        },
        {
          productId: SEED_DATA.PRODUCTS.ASSEMBLY_KIT,
          warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
          binId: SEED_DATA.BINS.DC_RACK_2,
          quantity: '25',
        },
      ],
    },
  ];

  for (const adj of adjustments) {
    const existingAdj = await db.query.inventoryAdjustments.findFirst({
      where: eq(inventoryAdjustments.id, adj.id),
    });

    if (existingAdj) {
      console.log(`   - Adjustment '${adj.reference}' already exists. Skipping.`);
      continue;
    }

    await db.transaction(async (tx) => {
      await tx.insert(inventoryAdjustments).values({
        id: adj.id,
        organizationId: SEED_DATA.ORGANIZATION_ID,
        adjustmentDate: new Date(),
        reason: adj.reason,
        reference: adj.reference,
        status: 'approved',
        createdBy: SEED_DATA.USER_ID,
        updatedBy: SEED_DATA.USER_ID,
      });

      for (const line of adj.lines) {
        await tx.insert(inventoryAdjustmentLines).values({
          organizationId: SEED_DATA.ORGANIZATION_ID,
          adjustmentId: adj.id,
          productId: line.productId,
          warehouseId: line.warehouseId,
          binId: line.binId,
          quantityChange: line.quantity,
          createdBy: SEED_DATA.USER_ID,
          updatedBy: SEED_DATA.USER_ID,
        });

        await tx
          .insert(inventoryLevels)
          .values({
            organizationId: SEED_DATA.ORGANIZATION_ID,
            productId: line.productId,
            warehouseId: line.warehouseId,
            binId: line.binId,
            quantityOnHand: line.quantity,
            createdBy: SEED_DATA.USER_ID,
            updatedBy: SEED_DATA.USER_ID,
          })
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
              updatedBy: SEED_DATA.USER_ID,
            },
          });

        await tx.insert(inventoryLedgers).values({
          organizationId: SEED_DATA.ORGANIZATION_ID,
          productId: line.productId,
          warehouseId: line.warehouseId,
          binId: line.binId,
          quantityChange: line.quantity,
          referenceType: 'adjustment',
          referenceId: adj.id,
          createdBy: SEED_DATA.USER_ID,
          updatedBy: SEED_DATA.USER_ID,
        });
      }
    });
    console.log(`   - Adjustment '${adj.reference}' created and levels updated.`);
  }
}
