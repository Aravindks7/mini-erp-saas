import { db } from '../index.js';
import { receipts, receiptLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';

export async function seedReceipts() {
  console.log('🌱 Seeding Detailed Production-Grade Receipts...');

  const orgId = SEED_DATA.ORGANIZATION_ID;
  const userId = SEED_DATA.USER_ID;

  // Helper for historical dates
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  // 1. Create Diverse Receipts (10 records)
  const receiptData = [
    {
      id: SEED_DATA.RECEIPTS.RCT_001,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_001,
      receiptNumber: 'RCT-0001',
      receivedDate: daysAgo(30),
      reference: 'PACK-12345',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_002,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_002,
      receiptNumber: 'RCT-0002',
      receivedDate: daysAgo(25),
      reference: 'PACK-67890',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_003,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_003,
      receiptNumber: 'RCT-0003',
      receivedDate: daysAgo(20),
      reference: 'PACK-ABC-789',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_004,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_004,
      receiptNumber: 'RCT-0004',
      receivedDate: daysAgo(15),
      reference: 'FEDEX-TRK-123',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_005,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_005,
      receiptNumber: 'RCT-0005',
      receivedDate: daysAgo(10),
      reference: 'UPS-XYZ-456',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_006,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_006,
      receiptNumber: 'RCT-0006',
      receivedDate: daysAgo(5),
      reference: 'DHL-DEL-789',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_007,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_007,
      receiptNumber: 'RCT-0007',
      receivedDate: daysAgo(2),
      reference: 'BOL-MOCK-001',
      status: 'draft' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_008,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_008,
      receiptNumber: 'RCT-0008',
      receivedDate: daysAgo(1),
      reference: 'IN-BOUND-MEMO',
      status: 'draft' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_009,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_009,
      receiptNumber: 'RCT-0009',
      receivedDate: daysAgo(1),
      reference: 'DAMAGED-ON-ARRIVAL',
      status: 'cancelled' as const,
      createdBy: userId,
      updatedBy: userId,
    },
    {
      id: SEED_DATA.RECEIPTS.RCT_010,
      organizationId: orgId,
      purchaseOrderId: SEED_DATA.PURCHASE_ORDERS.PO_010,
      receiptNumber: 'RCT-0010',
      receivedDate: new Date(),
      reference: 'PACK-DAILY-001',
      status: 'received' as const,
      createdBy: userId,
      updatedBy: userId,
    },
  ];

  for (const data of receiptData) {
    await db.insert(receipts).values(data).onConflictDoNothing();
  }

  // 2. Create Receipt Lines (Complex distributions)
  const lineData = [
    // RCT-0001
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_001,
      productId: SEED_DATA.PRODUCTS.WIDGET_A,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: SEED_DATA.BINS.MAIN_A1,
      quantityReceived: '50',
      createdBy: userId,
      updatedBy: userId,
    },
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_001,
      productId: SEED_DATA.PRODUCTS.WIDGET_B,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: SEED_DATA.BINS.MAIN_B1,
      quantityReceived: '25',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0002
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_002,
      productId: SEED_DATA.PRODUCTS.STEEL_SHEET,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      binId: SEED_DATA.BINS.DC_RACK_1,
      quantityReceived: '100',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0003
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_003,
      productId: SEED_DATA.PRODUCTS.COPPER_WIRE,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      binId: SEED_DATA.BINS.DC_RACK_2,
      quantityReceived: '500',
      createdBy: userId,
      updatedBy: userId,
    },
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_003,
      productId: SEED_DATA.PRODUCTS.ASSEMBLY_KIT,
      warehouseId: SEED_DATA.WAREHOUSES.SECONDARY,
      binId: null,
      quantityReceived: '10',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0004
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_004,
      productId: SEED_DATA.PRODUCTS.OFFICE_PAPER,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: null,
      quantityReceived: '200',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0005
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_005,
      productId: SEED_DATA.PRODUCTS.INK_CARTRIDGE,
      warehouseId: SEED_DATA.WAREHOUSES.MAIN,
      binId: null,
      quantityReceived: '50',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0006
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_006,
      productId: SEED_DATA.PRODUCTS.MICROCHIP_X,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      binId: SEED_DATA.BINS.DC_RACK_1,
      quantityReceived: '1000',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0007 (Draft)
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_007,
      productId: SEED_DATA.PRODUCTS.LED_DISPLAY,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      binId: null,
      quantityReceived: '100',
      createdBy: userId,
      updatedBy: userId,
    },
    // RCT-0010
    {
      organizationId: orgId,
      receiptId: SEED_DATA.RECEIPTS.RCT_010,
      productId: SEED_DATA.PRODUCTS.PACKAGING_BOX,
      warehouseId: SEED_DATA.WAREHOUSES.DIST_CENTER,
      binId: SEED_DATA.BINS.DC_RACK_2,
      quantityReceived: '5000',
      createdBy: userId,
      updatedBy: userId,
    },
  ];

  for (const data of lineData) {
    await db.insert(receiptLines).values(data).onConflictDoNothing();
  }

  console.log('✅ Detailed Receipts seeded.');
}
