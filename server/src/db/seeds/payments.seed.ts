import { db } from '../index.js';
import { payments } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { subDays } from 'date-fns';

/**
 * Seeds Payments for development.
 * Axiom: Demonstrate AR/AP reconciliation (Inbound from Customer, Outbound to Supplier).
 */
export async function seedPayments() {
  console.log('🌱 Seeding Payments...');

  const { ORGANIZATION_ID, USER_ID, CUSTOMERS, SUPPLIERS, INVOICES, BILLS, PAYMENTS } = SEED_DATA;

  const now = new Date();

  const seeds = [
    {
      id: PAYMENTS.PMT_001,
      paymentType: 'inbound' as const,
      paymentMethod: 'bank_transfer' as const,
      amount: '250.00',
      paymentDate: subDays(now, 1),
      status: 'completed' as const,
      referenceNumber: 'TXN-AR-001',
      customerId: CUSTOMERS.TECH_SOLUTIONS,
      invoiceId: INVOICES.INV_001, // Reconciles INV-001
      notes: 'Full payment for Tech Solutions invoice.',
    },
    {
      id: PAYMENTS.PMT_002,
      paymentType: 'outbound' as const,
      paymentMethod: 'check' as const,
      amount: '120.00',
      paymentDate: now,
      status: 'completed' as const,
      referenceNumber: 'CHK-100234',
      supplierId: SUPPLIERS.ACME_CORP,
      billId: BILLS.BILL_001, // Reconciles BILL-001
      notes: 'Partial payment for Acme Corp bill.',
    },
  ];

  for (const seed of seeds) {
    await db
      .insert(payments)
      .values({
        ...seed,
        organizationId: ORGANIZATION_ID,
        createdBy: USER_ID,
        updatedBy: USER_ID,
        createdAt: seed.paymentDate,
        updatedAt: seed.paymentDate,
      })
      .onConflictDoUpdate({
        target: [payments.id],
        set: {
          updatedAt: seed.paymentDate,
        },
      });

    console.log(`   - Payment '${seed.referenceNumber}' seeded.`);
  }
}
