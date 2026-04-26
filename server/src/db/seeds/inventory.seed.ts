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

  const adjustmentId = SEED_DATA.INVENTORY_ADJUSTMENTS.INITIAL_STOCK;

  // 1. Check if adjustment already exists
  const existingAdj = await db.query.inventoryAdjustments.findFirst({
    where: eq(inventoryAdjustments.id, adjustmentId),
  });

  if (existingAdj) {
    console.log('   - Initial stock adjustment already exists. Skipping.');
    return;
  }

  await db.transaction(async (tx) => {
    // 2. Create Header
    await tx.insert(inventoryAdjustments).values({
      id: adjustmentId,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      adjustmentDate: new Date(),
      reason: 'Initial System Load',
      reference: 'SEED-0001',
      status: 'approved',
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    });

    const lines = [
      {
        productId: SEED_DATA.PRODUCTS.WIDGET_A,
        warehouseId: SEED_DATA.WAREHOUSES.MAIN,
        binId: SEED_DATA.BINS.MAIN_A1,
        quantity: '100',
      },
      {
        productId: SEED_DATA.PRODUCTS.WIDGET_B,
        warehouseId: SEED_DATA.WAREHOUSES.MAIN,
        binId: SEED_DATA.BINS.MAIN_B1,
        quantity: '250',
      },
    ];

    for (const line of lines) {
      // 3. Create Line
      await tx.insert(inventoryAdjustmentLines).values({
        organizationId: SEED_DATA.ORGANIZATION_ID,
        adjustmentId: adjustmentId,
        productId: line.productId,
        warehouseId: line.warehouseId,
        binId: line.binId,
        quantityChange: line.quantity,
        createdBy: SEED_DATA.USER_ID,
        updatedBy: SEED_DATA.USER_ID,
      });

      // 4. Update Level
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

      // 5. Create Ledger Entry
      await tx.insert(inventoryLedgers).values({
        organizationId: SEED_DATA.ORGANIZATION_ID,
        productId: line.productId,
        warehouseId: line.warehouseId,
        binId: line.binId,
        quantityChange: line.quantity,
        referenceType: 'adjustment',
        referenceId: adjustmentId,
        createdBy: SEED_DATA.USER_ID,
        updatedBy: SEED_DATA.USER_ID,
      });
    }
  });

  console.log('   - Initial stock adjustment created and levels updated.');
}
