import { db } from '../index.js';
import { bills, billLines } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { subDays, addDays } from 'date-fns';

/**
 * Seeds Bills for development.
 * Axiom: Demonstrate full bill lifecycle (Draft, Open, Paid, Void).
 */
export async function seedBills() {
  console.log('🌱 Seeding Bills...');

  const { ORGANIZATION_ID, USER_ID, SUPPLIERS, PRODUCTS, PURCHASE_ORDERS, RECEIPTS, BILLS } =
    SEED_DATA;

  const now = new Date();

  const seeds = [
    {
      id: BILLS.BILL_001,
      supplierId: SUPPLIERS.ACME_CORP,
      purchaseOrderId: PURCHASE_ORDERS.PO_001,
      receiptId: RECEIPTS.RCT_001,
      referenceNumber: 'VEND-ACME-0001',
      status: 'paid' as const,
      issueDate: subDays(now, 10),
      dueDate: addDays(now, 20),
      totalAmount: '1200.00',
      taxAmount: '0.00',
      notes: 'Monthly bulk hardware supply',
      lines: [
        {
          productId: PRODUCTS.WIDGET_A,
          quantity: '10.00',
          unitPrice: '120.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '1200.00',
        },
      ],
    },
    {
      id: BILLS.BILL_002,
      supplierId: SUPPLIERS.GLOBAL_SPARES,
      purchaseOrderId: PURCHASE_ORDERS.PO_002,
      receiptId: RECEIPTS.RCT_002,
      referenceNumber: 'GS-2026-INV-55',
      status: 'open' as const,
      issueDate: subDays(now, 5),
      dueDate: addDays(now, 25),
      totalAmount: '450.00',
      taxAmount: '0.00',
      notes: 'Emergency spare parts',
      lines: [
        {
          productId: PRODUCTS.WIDGET_B,
          quantity: '5.00',
          unitPrice: '90.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '450.00',
        },
      ],
    },
    {
      id: BILLS.BILL_003,
      supplierId: SUPPLIERS.STEELWORKS_INC,
      purchaseOrderId: PURCHASE_ORDERS.PO_003,
      receiptId: RECEIPTS.RCT_003,
      referenceNumber: 'SW-2026-991',
      status: 'draft' as const,
      issueDate: subDays(now, 1),
      dueDate: addDays(now, 29),
      totalAmount: '2000.00',
      taxAmount: '0.00',
      notes: 'Pending confirmation of steel sheets quality',
      lines: [
        {
          productId: PRODUCTS.STEEL_SHEET,
          quantity: '20.00',
          unitPrice: '100.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '2000.00',
        },
      ],
    },
    {
      id: BILLS.BILL_004,
      supplierId: SUPPLIERS.OFFICE_DEPOT,
      purchaseOrderId: null,
      receiptId: null,
      referenceNumber: 'OD-PAPER-001',
      status: 'void' as const,
      issueDate: subDays(now, 30),
      dueDate: now,
      totalAmount: '150.00',
      taxAmount: '0.00',
      notes: 'Cancelled due to incorrect shipment address',
      lines: [
        {
          productId: PRODUCTS.OFFICE_PAPER,
          quantity: '10.00',
          unitPrice: '15.00',
          taxRateAtOrder: '0.00',
          taxAmount: '0.00',
          lineTotal: '150.00',
        },
      ],
    },
    {
      id: BILLS.BILL_005,
      supplierId: SUPPLIERS.SILICON_SUPPLY,
      purchaseOrderId: null,
      receiptId: null,
      referenceNumber: 'SIL-X-2026',
      status: 'open' as const,
      issueDate: subDays(now, 2),
      dueDate: addDays(now, 13),
      totalAmount: '5000.00',
      taxAmount: '250.00',
      notes: 'High-end microchips',
      lines: [
        {
          productId: PRODUCTS.MICROCHIP_X,
          quantity: '50.00',
          unitPrice: '100.00',
          taxRateAtOrder: '5.00',
          taxAmount: '250.00',
          lineTotal: '5250.00',
        },
      ],
    },
  ];

  for (const [index, seed] of seeds.entries()) {
    await db
      .insert(bills)
      .values({
        id: seed.id,
        organizationId: ORGANIZATION_ID,
        supplierId: seed.supplierId,
        purchaseOrderId: seed.purchaseOrderId,
        receiptId: seed.receiptId,
        documentNumber: `BILL-2026-${index + 1}`.padStart(14, '0'),
        referenceNumber: seed.referenceNumber,
        status: seed.status,
        issueDate: seed.issueDate,
        dueDate: seed.dueDate,
        totalAmount: seed.totalAmount,
        taxAmount: seed.taxAmount,
        notes: seed.notes,
        createdAt: seed.issueDate,
        updatedAt: seed.issueDate,
        createdBy: USER_ID,
        updatedBy: USER_ID,
      })
      .onConflictDoUpdate({
        target: [bills.id],
        set: {
          updatedAt: new Date(),
        },
      });

    for (const line of seed.lines) {
      await db
        .insert(billLines)
        .values({
          organizationId: ORGANIZATION_ID,
          billId: seed.id,
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
    console.log(`   - Bill '${seed.referenceNumber}' seeded.`);
  }
}
