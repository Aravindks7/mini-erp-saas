import { SEED_DATA } from './constants.js';
import { runInventoryScenario } from './engine/workflows/inventory.workflow.js';
import { subDays } from 'date-fns';

/**
 * Seeds the initial inventory state using the scenario engine.
 * Generates adjustments and transfers over a 180-day timeline.
 */
export async function seedInventory() {
  console.log('🌱 Generating Inventory Scenarios (Adjustments & Transfers)...');
  const { ORGANIZATION_ID, USER_ID, PRODUCTS, WAREHOUSES, BINS } = SEED_DATA;
  const now = new Date();

  const activeProductIds: string[] = [
    PRODUCTS.WIDGET_A,
    PRODUCTS.WIDGET_B,
    PRODUCTS.STEEL_SHEET,
    PRODUCTS.COPPER_WIRE,
    PRODUCTS.OFFICE_PAPER,
    PRODUCTS.INK_CARTRIDGE,
    PRODUCTS.MICROCHIP_X,
    PRODUCTS.LED_DISPLAY,
    PRODUCTS.PACKAGING_BOX,
    PRODUCTS.ASSEMBLY_KIT,
  ];

  const warehouseList = [
    { warehouseId: WAREHOUSES.MAIN, binId: BINS.MAIN_A1 },
    { warehouseId: WAREHOUSES.DIST_CENTER, binId: BINS.DC_RACK_1 },
    { warehouseId: WAREHOUSES.SECONDARY, binId: BINS.SEC_RACK_1 },
  ];

  // 1. Initial Opening Stock (Approved Adjustments)
  console.log('   - Seeding Initial Opening Stock...');
  for (let i = 0; i < activeProductIds.length; i++) {
    const productId = activeProductIds[i]!;
    const warehouse = warehouseList[i % warehouseList.length]!;

    await runInventoryScenario({
      scenarioId: 'INV-OPEN',
      index: i,
      organizationId: ORGANIZATION_ID,
      userId: USER_ID,
      productId,
      warehouseId: warehouse.warehouseId,
      binId: warehouse.binId,
      quantity: '2000.00',
      createdAt: subDays(now, 180),
      flow: 'positive_adjustment',
    });
  }

  // 2. Inventory Transaction Scenarios (Adjustments & Transfers)
  const inventoryFlows: Array<Parameters<typeof runInventoryScenario>[0]['flow']> = [
    'positive_adjustment',
    'negative_adjustment',
    'draft_adjustment',
    'cancelled_adjustment',
    'transfer_shipped',
    'transfer_received',
    'transfer_draft',
    'transfer_cancelled',
  ];

  console.log(`   - Generating ${inventoryFlows.length * 5} Dynamic Inventory Scenarios...`);
  let invCount = 0;

  for (let i = 0; i < inventoryFlows.length; i++) {
    const flow = inventoryFlows[i]!;
    for (let j = 0; j < 5; j++) {
      invCount++;
      const productId = activeProductIds[invCount % activeProductIds.length]!;
      const fromWarehouse = warehouseList[invCount % warehouseList.length]!;
      const toWarehouse = warehouseList[(invCount + 1) % warehouseList.length]!;

      await runInventoryScenario({
        scenarioId: 'INV-TRANS',
        index: invCount + 100, // Offset from opening stock
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        productId,
        warehouseId: fromWarehouse.warehouseId,
        binId: fromWarehouse.binId,
        toWarehouseId: toWarehouse.warehouseId,
        quantity: String((j + 1) * 20) + '.00',
        createdAt: subDays(
          now,
          Math.max(0, 150 - Math.floor(invCount * (150 / (inventoryFlows.length * 5)))),
        ),
        flow,
      });
    }
  }

  console.log(`✅ ${activeProductIds.length + invCount} Inventory Scenarios completed.`);
}
