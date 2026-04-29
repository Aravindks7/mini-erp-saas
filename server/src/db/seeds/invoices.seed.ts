import { db } from '../index.js';
import { invoices, invoiceLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { subDays, addDays } from 'date-fns';

/**
 * Seeds Invoices for development.
 * Axiom: Demonstrate full invoice lifecycle (Draft, Open, Paid, Void).
 */
export async function seedInvoices() {
  console.log('🌱 Seeding Invoices...');

  const { ORGANIZATION_ID, USER_ID, CUSTOMERS, PRODUCTS, SALES_ORDERS, INVOICES } = SEED_DATA;

  const now = new Date();

  const seeds = [
    {
      id: INVOICES.INV_001,
      customerId: CUSTOMERS.TECH_SOLUTIONS,
      salesOrderId: SALES_ORDERS.SO_002, // Linked to shipped SO
      documentNumber: 'INV-2026-0001',
      status: 'paid' as const,
      issueDate: subDays(now, 1),
      dueDate: addDays(now, 29),
      totalAmount: '250.00',
      taxAmount: '10.00',
      createdAt: subDays(now, 1),
      lines: [
        {
          productId: PRODUCTS.OFFICE_PAPER,
          quantity: '20.00',
          unitPrice: '12.00',
          taxRateAtOrder: '4.16666667',
          taxAmount: '10.00',
          lineTotal: '250.00',
        },
      ],
    },
    {
      id: INVOICES.INV_002,
      customerId: CUSTOMERS.RETAIL_GIANT,
      salesOrderId: SALES_ORDERS.SO_007, // Linked to shipped SO
      documentNumber: 'INV-2026-0002',
      status: 'open' as const,
      issueDate: subDays(now, 2),
      dueDate: addDays(now, 28),
      totalAmount: '45.00',
      taxAmount: '0.00',
      createdAt: subDays(now, 2),
      lines: [
        {
          productId: PRODUCTS.INK_CARTRIDGE,
          quantity: '1.00',
          unitPrice: '45.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '45.00',
        },
      ],
    },
    {
      id: '94000000-0000-4000-a000-000000000003',
      customerId: CUSTOMERS.LOCAL_HARDWARE,
      salesOrderId: null,
      documentNumber: 'INV-2026-0003',
      status: 'draft' as const,
      issueDate: now,
      dueDate: addDays(now, 30),
      totalAmount: '500.00',
      taxAmount: '0.00',
      createdAt: now,
      lines: [
        {
          productId: PRODUCTS.WIDGET_A,
          quantity: '5.00',
          unitPrice: '100.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '500.00',
        },
      ],
    },
  ];

  for (const seed of seeds) {
    await db
      .insert(invoices)
      .values({
        id: seed.id,
        organizationId: ORGANIZATION_ID,
        customerId: seed.customerId,
        salesOrderId: seed.salesOrderId,
        documentNumber: seed.documentNumber,
        status: seed.status,
        issueDate: seed.issueDate,
        dueDate: seed.dueDate,
        totalAmount: seed.totalAmount,
        taxAmount: seed.taxAmount,
        createdAt: seed.createdAt,
        updatedAt: seed.createdAt,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoUpdate({
        target: [invoices.id],
        set: {
          createdAt: seed.createdAt,
          updatedAt: seed.createdAt,
        },
      });

    for (const line of seed.lines) {
      await db
        .insert(invoiceLines)
        .values({
          organizationId: ORGANIZATION_ID,
          invoiceId: seed.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRateAtOrder: line.taxRateAtOrder,
          taxAmount: line.taxAmount,
          lineTotal: line.lineTotal,
          createdBy: USER_ID,
          updatedBy: USER_ID,
        })
        .onConflictDoNothing();
    }
    console.log(`   - Invoice '${seed.documentNumber}' seeded.`);
  }
}
