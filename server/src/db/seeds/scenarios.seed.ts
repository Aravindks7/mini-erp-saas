import { SEED_DATA } from './constants.js';
import { runO2CScenario } from './engine/workflows/order-to-cash.workflow.js';
import { runP2PScenario } from './engine/workflows/procure-to-pay.workflow.js';
import { subDays } from 'date-fns';

export async function seedScenarios() {
  console.log('🌱 Executing Exhaustive Deterministic Scenarios...');
  const { ORGANIZATION_ID, USER_ID, CUSTOMERS, PRODUCTS, SUPPLIERS, WAREHOUSES, BINS } = SEED_DATA;
  const now = new Date();

  /**
   * CRITICAL: Only cycle active products through scenario engine.
   *
   * Inactive products have no inventory seeded, so any shipment deduction
   * against them would immediately violate the `quantity_on_hand >= 0` Postgres
   * check constraint added to inventory_levels. This filter is the safety gate
   * that preserves referential and constraint integrity across the full seed run.
   */
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

  const customerList = Object.values(CUSTOMERS).filter((id) =>
    // Exclude inactive customers from scenario cycling — they exist only for list-view testing
    [
      CUSTOMERS.TECH_SOLUTIONS,
      CUSTOMERS.RETAIL_GIANT,
      CUSTOMERS.LOCAL_HARDWARE,
      CUSTOMERS.BUILDIT_CO,
      CUSTOMERS.MEGAMART,
      CUSTOMERS.GLOBAL_DISTRIBUTORS,
      CUSTOMERS.SMART_ELECTRONICS,
      CUSTOMERS.CITY_SUPERMARKET,
      CUSTOMERS.NATIONAL_SUPPLY,
      CUSTOMERS.EXPRESS_RETAIL,
    ].includes(id),
  );

  const supplierList = Object.values(SUPPLIERS).filter((id) =>
    // Exclude inactive suppliers from scenario cycling
    [
      SUPPLIERS.ACME_CORP,
      SUPPLIERS.GLOBAL_SPARES,
      SUPPLIERS.STEELWORKS_INC,
      SUPPLIERS.OFFICE_DEPOT,
      SUPPLIERS.SILICON_SUPPLY,
      SUPPLIERS.METAL_WORKS,
      SUPPLIERS.TECH_PARTS,
      SUPPLIERS.PACKAGING_PROS,
      SUPPLIERS.LOGISTICS_CO,
      SUPPLIERS.PREMIER_IT,
    ].includes(id),
  );

  /**
   * P2P warehouse rotation: alternate receipts between Main and Distribution Center.
   *
   * This is the key driver for multi-warehouse inventory data. Without this,
   * the DC would only ever receive stock from the static opening adjustment,
   * not from actual purchase order receipts.
   */
  const p2pWarehouseRotation: Array<{ warehouseId: string; binId: string }> = [
    { warehouseId: WAREHOUSES.MAIN, binId: BINS.MAIN_A1 },
    { warehouseId: WAREHOUSES.DIST_CENTER, binId: BINS.DC_RACK_1 },
    { warehouseId: WAREHOUSES.MAIN, binId: BINS.MAIN_B1 },
    { warehouseId: WAREHOUSES.DIST_CENTER, binId: BINS.DC_RACK_2 },
  ];

  // 1. Order-to-Cash Flows (15 flow types)
  const o2cFlows: Array<Parameters<typeof runO2CScenario>[0]['flow']> = [
    'full',
    'partial_ship_full_pay',
    'full_ship_partial_pay',
    'draft_only',
    'draft_shipment',
    'draft_invoice',
    'overdue_invoice',
    'cancelled_order',
    'cancelled_shipment',
    'void_invoice',
    'failed_payment',
    'refunded_payment',
    'stripe_pending',
    'stripe_failed',
    'stripe_expired',
  ];

  console.log(`   - Generating ${o2cFlows.length * 8} O2C Scenarios (Over 180 Days)...`);
  let o2cCount = 0;
  const o2cConfigs: Parameters<typeof runO2CScenario>[0][] = [];

  for (let i = 0; i < o2cFlows.length; i++) {
    const flow = o2cFlows[i]!;
    for (let j = 0; j < 8; j++) {
      o2cCount++;
      const customer = customerList[o2cCount % customerList.length]!;
      const product = activeProductIds[o2cCount % activeProductIds.length]!;

      o2cConfigs.push({
        scenarioId: 'O2C',
        index: o2cCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        customerId: customer,
        productId: product,
        createdAt: subDays(
          now,
          Math.max(0, 180 - Math.floor(o2cCount * (180 / (o2cFlows.length * 8)))),
        ),
        quantity: String(((j % 5) + 1) * 5) + '.00',
        unitPrice: String((i + 1) * 25) + '.00',
        flow,
      });
    }
  }

  // Batch process O2C scenarios (Concurrent batches of 30)
  const O2C_BATCH_SIZE = 30;
  for (let i = 0; i < o2cConfigs.length; i += O2C_BATCH_SIZE) {
    const batch = o2cConfigs.slice(i, i + O2C_BATCH_SIZE);
    await Promise.all(batch.map((config) => runO2CScenario(config)));
    if ((i + O2C_BATCH_SIZE) % 60 === 0 || i + O2C_BATCH_SIZE >= o2cConfigs.length) {
      console.log(
        `     * Processed ${Math.min(i + O2C_BATCH_SIZE, o2cConfigs.length)} / ${o2cConfigs.length} O2C scenarios...`,
      );
    }
  }

  // 2. Procure-to-Pay Flows (12 flow types)
  const p2pFlows: Array<Parameters<typeof runP2PScenario>[0]['flow']> = [
    'full',
    'partial_receipt_full_pay',
    'full_receipt_partial_pay',
    'draft_only',
    'draft_receipt',
    'draft_bill',
    'overdue_bill',
    'cancelled_order',
    'cancelled_receipt',
    'void_bill',
    'failed_payment',
    'refunded_payment',
  ];

  console.log(`   - Generating ${p2pFlows.length * 6} P2P Scenarios (Over 180 Days)...`);
  let p2pCount = 0;
  const p2pConfigs: Parameters<typeof runP2PScenario>[0][] = [];

  for (let i = 0; i < p2pFlows.length; i++) {
    const flow = p2pFlows[i]!;
    for (let j = 0; j < 6; j++) {
      p2pCount++;
      const supplier = supplierList[p2pCount % supplierList.length]!;
      const product = activeProductIds[p2pCount % activeProductIds.length]!;
      const warehouseTarget = p2pWarehouseRotation[p2pCount % p2pWarehouseRotation.length]!;

      p2pConfigs.push({
        scenarioId: 'P2P',
        index: p2pCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        supplierId: supplier,
        productId: product,
        createdAt: subDays(
          now,
          Math.max(0, 180 - Math.floor(p2pCount * (180 / (p2pFlows.length * 6)))),
        ),
        quantity: String(((j % 5) + 1) * 10) + '.00',
        unitPrice: String((i + 1) * 15) + '.00',
        flow,
        warehouseId: warehouseTarget.warehouseId,
        binId: warehouseTarget.binId,
      });
    }
  }

  // Batch process P2P scenarios (Concurrent batches of 30)
  const P2P_BATCH_SIZE = 30;
  for (let i = 0; i < p2pConfigs.length; i += P2P_BATCH_SIZE) {
    const batch = p2pConfigs.slice(i, i + P2P_BATCH_SIZE);
    await Promise.all(batch.map((config) => runP2PScenario(config)));
    if ((i + P2P_BATCH_SIZE) % 60 === 0 || i + P2P_BATCH_SIZE >= p2pConfigs.length) {
      console.log(
        `     * Processed ${Math.min(i + P2P_BATCH_SIZE, p2pConfigs.length)} / ${p2pConfigs.length} P2P scenarios...`,
      );
    }
  }

  console.log(`✅ ${o2cCount + p2pCount} Deterministic Scenarios completed.`);
}
