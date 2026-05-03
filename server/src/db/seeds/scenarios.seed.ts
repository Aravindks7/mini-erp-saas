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

  // 1. Order-to-Cash Flows (13 flow types × 3 instances = 39 scenarios)
  const o2cFlows: Array<Parameters<typeof runO2CScenario>[0]['flow']> = [
    'full',
    'partial_ship_full_pay',
    'full_ship_partial_pay',
    'draft_only',
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

  console.log(`   - Generating ${o2cFlows.length * 3} O2C Scenarios...`);
  let o2cCount = 0;
  for (let i = 0; i < o2cFlows.length; i++) {
    const flow = o2cFlows[i]!;
    for (let j = 0; j < 3; j++) {
      o2cCount++;
      const customer = customerList[o2cCount % customerList.length]!;
      const product = activeProductIds[o2cCount % activeProductIds.length]!;

      await runO2CScenario({
        scenarioId: 'O2C',
        index: o2cCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        customerId: customer,
        productId: product,
        // Spread scenarios across the last 60 days for time-series analytics
        createdAt: subDays(now, 60 - o2cCount),
        quantity: String((j + 1) * 5) + '.00',
        unitPrice: String((i + 1) * 25) + '.00',
        flow,
      });
    }
  }

  // 2. Procure-to-Pay Flows (10 flow types × 3 instances = 30 scenarios)
  const p2pFlows: Array<Parameters<typeof runP2PScenario>[0]['flow']> = [
    'full',
    'partial_receipt_full_pay',
    'full_receipt_partial_pay',
    'draft_only',
    'overdue_bill',
    'cancelled_order',
    'cancelled_receipt',
    'void_bill',
    'failed_payment',
    'refunded_payment',
  ];

  console.log(`   - Generating ${p2pFlows.length * 3} P2P Scenarios...`);
  let p2pCount = 0;
  for (let i = 0; i < p2pFlows.length; i++) {
    const flow = p2pFlows[i]!;
    for (let j = 0; j < 3; j++) {
      p2pCount++;
      const supplier = supplierList[p2pCount % supplierList.length]!;
      const product = activeProductIds[p2pCount % activeProductIds.length]!;

      // Rotate through warehouse/bin pairs to spread po_receipt ledger entries
      const warehouseTarget = p2pWarehouseRotation[p2pCount % p2pWarehouseRotation.length]!;

      await runP2PScenario({
        scenarioId: 'P2P',
        index: p2pCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        supplierId: supplier,
        productId: product,
        // Spread scenarios across the last 30 days for time-series analytics
        createdAt: subDays(now, 30 - p2pCount),
        quantity: String((j + 1) * 10) + '.00',
        unitPrice: String((i + 1) * 15) + '.00',
        flow,
        warehouseId: warehouseTarget.warehouseId,
        binId: warehouseTarget.binId,
      });
    }
  }

  console.log(`✅ ${o2cCount + p2pCount} Deterministic Scenarios completed.`);
}
