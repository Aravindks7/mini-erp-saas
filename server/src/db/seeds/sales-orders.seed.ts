import { db } from '../index.js';
import { salesOrders, salesOrderLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { subDays, subHours } from 'date-fns';

/**
 * Seeds Sales Orders for development.
 * Axiom: Demonstrate full sales lifecycle (Draft, Approved, Shipped, Cancelled).
 */
export async function seedSalesOrders() {
  console.log('🌱 Seeding Sales Orders...');

  const { ORGANIZATION_ID, USER_ID, CUSTOMERS, PRODUCTS, SALES_ORDERS } = SEED_DATA;

  const now = new Date();

  const orders = [
    {
      id: SALES_ORDERS.SO_001,
      customerId: CUSTOMERS.TECH_SOLUTIONS,
      documentNumber: 'SO-2026-0001',
      status: 'draft' as const,
      totalAmount: '1200.00',
      createdAt: subHours(now, 2),
      lines: [
        {
          productId: PRODUCTS.LED_DISPLAY,
          quantity: '2.00',
          unitPrice: '500.00',
          taxRateAtOrder: '20.00',
          taxAmount: '200.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_002,
      customerId: CUSTOMERS.RETAIL_GIANT,
      documentNumber: 'SO-2026-0002',
      status: 'shipped' as const,
      totalAmount: '250.00',
      createdAt: subDays(now, 1),
      lines: [
        {
          productId: PRODUCTS.OFFICE_PAPER,
          quantity: '20.00',
          unitPrice: '12.00',
          taxRateAtOrder: '4.16666667',
          taxAmount: '10.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_003,
      customerId: CUSTOMERS.LOCAL_HARDWARE,
      documentNumber: 'SO-2026-0003',
      status: 'approved' as const,
      totalAmount: '500.00',
      createdAt: subDays(now, 2),
      lines: [
        {
          productId: PRODUCTS.WIDGET_A,
          quantity: '5.00',
          unitPrice: '100.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_004,
      customerId: CUSTOMERS.BUILDIT_CO,
      documentNumber: 'SO-2026-0004',
      status: 'cancelled' as const,
      totalAmount: '1100.00',
      createdAt: subDays(now, 3),
      lines: [
        {
          productId: PRODUCTS.ASSEMBLY_KIT,
          quantity: '1.00',
          unitPrice: '1000.00',
          taxRateAtOrder: '10.00',
          taxAmount: '100.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_005,
      customerId: CUSTOMERS.MEGAMART,
      documentNumber: 'SO-2026-0005',
      status: 'draft' as const,
      totalAmount: '2250.00',
      createdAt: subDays(now, 4),
      lines: [
        {
          productId: PRODUCTS.MICROCHIP_X,
          quantity: '10.00',
          unitPrice: '225.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_006,
      customerId: CUSTOMERS.TECH_SOLUTIONS,
      documentNumber: 'SO-2026-0006',
      status: 'approved' as const,
      totalAmount: '750.00',
      createdAt: subDays(now, 5),
      lines: [
        {
          productId: PRODUCTS.WIDGET_B,
          quantity: '10.00',
          unitPrice: '75.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_007,
      customerId: CUSTOMERS.RETAIL_GIANT,
      documentNumber: 'SO-2026-0007',
      status: 'shipped' as const,
      totalAmount: '45.00',
      createdAt: subDays(now, 6),
      lines: [
        {
          productId: PRODUCTS.INK_CARTRIDGE,
          quantity: '1.00',
          unitPrice: '45.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_008,
      customerId: CUSTOMERS.LOCAL_HARDWARE,
      documentNumber: 'SO-2026-0008',
      status: 'approved' as const,
      totalAmount: '300.00',
      createdAt: subDays(now, 7),
      lines: [
        {
          productId: PRODUCTS.STEEL_SHEET,
          quantity: '6.00',
          unitPrice: '50.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_009,
      customerId: CUSTOMERS.BUILDIT_CO,
      documentNumber: 'SO-2026-0009',
      status: 'shipped' as const,
      totalAmount: '150.00',
      createdAt: subDays(now, 8),
      lines: [
        {
          productId: PRODUCTS.COPPER_WIRE,
          quantity: '1.00',
          unitPrice: '150.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
    {
      id: SALES_ORDERS.SO_010,
      customerId: CUSTOMERS.MEGAMART,
      documentNumber: 'SO-2026-0010',
      status: 'draft' as const,
      totalAmount: '900.00',
      createdAt: subDays(now, 9),
      lines: [
        {
          productId: PRODUCTS.WIDGET_A,
          quantity: '10.00',
          unitPrice: '90.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
        },
      ],
    },
  ];

  for (const order of orders) {
    await db
      .insert(salesOrders)
      .values({
        id: order.id,
        organizationId: ORGANIZATION_ID,
        customerId: order.customerId,
        documentNumber: order.documentNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.createdAt,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoUpdate({
        target: [salesOrders.id],
        set: {
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
        },
      });

    for (const line of order.lines) {
      await db
        .insert(salesOrderLines)
        .values({
          organizationId: ORGANIZATION_ID,
          salesOrderId: order.id,
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
    console.log(`   - Sales Order '${order.documentNumber}' seeded.`);
  }
}
