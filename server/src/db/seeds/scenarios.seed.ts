import { SEED_DATA } from './constants.js';
import { runO2CScenario } from './engine/workflows/order-to-cash.workflow.js';
import { runP2PScenario } from './engine/workflows/procure-to-pay.workflow.js';
import { subDays } from 'date-fns';

export async function seedScenarios() {
  console.log('🌱 Executing Exhaustive Deterministic Scenarios...');
  const { ORGANIZATION_ID, USER_ID, CUSTOMERS, PRODUCTS, SUPPLIERS } = SEED_DATA;
  const now = new Date();

  // Helper to get array of values from object
  const getValues = (obj: any) => Object.values(obj) as string[];

  const customerList = getValues(CUSTOMERS);
  const supplierList = getValues(SUPPLIERS);
  const productList = getValues(PRODUCTS);

  // 1. Order-to-Cash Flows (13 total)
  const o2cFlows: any[] = [
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
    const flow = o2cFlows[i];
    // Create 3 records for each flow type to ensure variety
    for (let j = 0; j < 3; j++) {
      o2cCount++;
      const customer = customerList[o2cCount % customerList.length];
      const product = productList[o2cCount % productList.length];

      await runO2CScenario({
        scenarioId: 'O2C',
        index: o2cCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        customerId: customer,
        productId: product,
        createdAt: subDays(now, 60 - o2cCount),
        quantity: String((j + 1) * 5) + '.00',
        unitPrice: String((i + 1) * 25) + '.00',
        flow: flow,
      });
    }
  }

  // 2. Procure-to-Pay Flows (10 total)
  const p2pFlows: any[] = [
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
    const flow = p2pFlows[i];
    // Create 3 records for each flow type
    for (let j = 0; j < 3; j++) {
      p2pCount++;
      const supplier = supplierList[p2pCount % supplierList.length];
      const product = productList[p2pCount % productList.length];

      await runP2PScenario({
        scenarioId: 'P2P',
        index: p2pCount,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        supplierId: supplier,
        productId: product,
        createdAt: subDays(now, 30 - p2pCount),
        quantity: String((j + 1) * 10) + '.00',
        unitPrice: String((i + 1) * 15) + '.00',
        flow: flow,
      });
    }
  }

  console.log(`✅ ${o2cCount + p2pCount} Deterministic Scenarios completed.`);
}
