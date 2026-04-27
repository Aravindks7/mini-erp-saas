import { db } from '../index.js';
import { purchaseOrders, purchaseOrderLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { subDays, subHours } from 'date-fns';

/**
 * Seeds Purchase Orders for development.
 * Axiom: Demonstrate full procurement lifecycle (Draft, Sent, Received, Cancelled).
 */
export async function seedPurchaseOrders() {
  console.log('🌱 Seeding Purchase Orders...');

  const { ORGANIZATION_ID, USER_ID, SUPPLIERS, PRODUCTS, PURCHASE_ORDERS } = SEED_DATA;

  const now = new Date();

  const orders = [
    {
      id: PURCHASE_ORDERS.PO_001,
      supplierId: SUPPLIERS.ACME_CORP,
      documentNumber: 'PO-2026-0001',
      status: 'draft' as const,
      totalAmount: '1100.00',
      createdAt: subHours(now, 5),
      lines: [
        {
          productId: PRODUCTS.WIDGET_A,
          quantity: '10.00',
          unitPrice: '100.00',
          taxRateAtOrder: '10.00',
          taxAmount: '100.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_002,
      supplierId: SUPPLIERS.GLOBAL_SPARES,
      documentNumber: 'PO-2026-0002',
      status: 'received' as const,
      totalAmount: '500.00',
      createdAt: subDays(now, 1),
      lines: [
        {
          productId: PRODUCTS.WIDGET_B,
          quantity: '5.00',
          unitPrice: '100.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_003,
      supplierId: SUPPLIERS.STEELWORKS_INC,
      documentNumber: 'PO-2026-0003',
      status: 'sent' as const,
      totalAmount: '2475.00',
      createdAt: subDays(now, 2),
      lines: [
        {
          productId: PRODUCTS.STEEL_SHEET,
          quantity: '50.00',
          unitPrice: '45.00',
          taxRateAtOrder: '10.00',
          taxAmount: '225.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_004,
      supplierId: SUPPLIERS.OFFICE_DEPOT,
      documentNumber: 'PO-2026-0004',
      status: 'cancelled' as const,
      totalAmount: '132.00',
      createdAt: subDays(now, 3),
      lines: [
        {
          productId: PRODUCTS.OFFICE_PAPER,
          quantity: '10.00',
          unitPrice: '12.00',
          taxRateAtOrder: '10.00',
          taxAmount: '12.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_005,
      supplierId: SUPPLIERS.SILICON_SUPPLY,
      documentNumber: 'PO-2026-0005',
      status: 'draft' as const,
      totalAmount: '4500.00',
      createdAt: subDays(now, 4),
      lines: [
        {
          productId: PRODUCTS.MICROCHIP_X,
          quantity: '20.00',
          unitPrice: '225.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_006,
      supplierId: SUPPLIERS.ACME_CORP,
      documentNumber: 'PO-2026-0006',
      status: 'received' as const,
      totalAmount: '350.00',
      createdAt: subDays(now, 5),
      lines: [
        {
          productId: PRODUCTS.INK_CARTRIDGE,
          quantity: '7.00',
          unitPrice: '50.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_007,
      supplierId: SUPPLIERS.GLOBAL_SPARES,
      documentNumber: 'PO-2026-0007',
      status: 'sent' as const,
      totalAmount: '900.00',
      createdAt: subDays(now, 6),
      lines: [
        {
          productId: PRODUCTS.LED_DISPLAY,
          quantity: '5.00',
          unitPrice: '180.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_008,
      supplierId: SUPPLIERS.STEELWORKS_INC,
      documentNumber: 'PO-2026-0008',
      status: 'received' as const,
      totalAmount: '450.00',
      createdAt: subDays(now, 7),
      lines: [
        {
          productId: PRODUCTS.STEEL_SHEET,
          quantity: '10.00',
          unitPrice: '45.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_009,
      supplierId: SUPPLIERS.OFFICE_DEPOT,
      documentNumber: 'PO-2026-0009',
      status: 'draft' as const,
      totalAmount: '120.00',
      createdAt: subDays(now, 8),
      lines: [
        {
          productId: PRODUCTS.OFFICE_PAPER,
          quantity: '10.00',
          unitPrice: '12.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: PURCHASE_ORDERS.PO_010,
      supplierId: SUPPLIERS.SILICON_SUPPLY,
      documentNumber: 'PO-2026-0010',
      status: 'sent' as const,
      totalAmount: '2500.00',
      createdAt: subDays(now, 9),
      lines: [
        {
          productId: PRODUCTS.MICROCHIP_X,
          quantity: '10.00',
          unitPrice: '250.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
  ];

  for (const order of orders) {
    await db
      .insert(purchaseOrders)
      .values({
        id: order.id,
        organizationId: ORGANIZATION_ID,
        supplierId: order.supplierId,
        documentNumber: order.documentNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoUpdate({
        target: [purchaseOrders.id],
        set: {
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
        },
      });

    for (const line of order.lines) {
      await db
        .insert(purchaseOrderLines)
        .values({
          organizationId: ORGANIZATION_ID,
          purchaseOrderId: order.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRateAtOrder: line.taxRateAtOrder,
          taxAmount: line.taxAmount,
          createdBy: USER_ID,
          updatedBy: USER_ID,
        })
        .onConflictDoNothing();
    }
    console.log(`   - Purchase Order '${order.documentNumber}' seeded.`);
  }
}
