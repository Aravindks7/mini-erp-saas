import { db } from '../index.js';
import { shipments, shipmentLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { eq } from 'drizzle-orm';

export async function seedShipments() {
  console.log('🌱 Seeding Shipments...');

  const orgId = SEED_DATA.ORGANIZATION_ID;
  const userId = SEED_DATA.USER_ID;

  // 1. Shipment for SO_001
  const existingShipment1 = await db.query.shipments.findFirst({
    where: eq(shipments.id, SEED_DATA.SHIPMENTS.SHP_001),
  });

  if (!existingShipment1) {
    await db.insert(shipments).values({
      id: SEED_DATA.SHIPMENTS.SHP_001,
      organizationId: orgId,
      salesOrderId: SEED_DATA.SALES_ORDERS.SO_001,
      shipmentNumber: 'SHP-2026-0001',
      shipmentDate: new Date('2026-04-20'),
      reference: 'FedEx-78901234',
      status: 'shipped',
      createdBy: userId,
      updatedBy: userId,
    });

    await db.insert(shipmentLines).values([
      {
        organizationId: orgId,
        shipmentId: SEED_DATA.SHIPMENTS.SHP_001,
        productId: SEED_DATA.PRODUCTS.WIDGET_A,
        warehouseId: SEED_DATA.WAREHOUSES.MAIN,
        binId: SEED_DATA.BINS.MAIN_A1,
        salesOrderLineId: null, // Placeholder or fetch actual if needed
        quantityShipped: '50.00000000',
        createdBy: userId,
        updatedBy: userId,
      },
    ]);
    console.log('   - Shipment SHP-2026-0001 created.');
  }

  // 2. Shipment for SO_002
  const existingShipment2 = await db.query.shipments.findFirst({
    where: eq(shipments.id, SEED_DATA.SHIPMENTS.SHP_002),
  });

  if (!existingShipment2) {
    await db.insert(shipments).values({
      id: SEED_DATA.SHIPMENTS.SHP_002,
      organizationId: orgId,
      salesOrderId: SEED_DATA.SALES_ORDERS.SO_002,
      shipmentNumber: 'SHP-2026-0002',
      shipmentDate: new Date('2026-04-25'),
      reference: 'UPS-55667788',
      status: 'shipped',
      createdBy: userId,
      updatedBy: userId,
    });

    await db.insert(shipmentLines).values([
      {
        organizationId: orgId,
        shipmentId: SEED_DATA.SHIPMENTS.SHP_002,
        productId: SEED_DATA.PRODUCTS.STEEL_SHEET,
        warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
        binId: SEED_DATA.BINS.DC_RACK_1,
        salesOrderLineId: null,
        quantityShipped: '100.00000000',
        createdBy: userId,
        updatedBy: userId,
      },
    ]);
    console.log('   - Shipment SHP-2026-0002 created.');
  }
}
