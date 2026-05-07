import 'dotenv/config';
import { db } from '../src/db/index.js';
import {
  activityLogs,
  user,
  roles,
  organizationMemberships,
  taxes,
  unitOfMeasures,
  productCategories,
  customers,
  products,
  suppliers,
  warehouses,
  bins,
  inventoryAdjustments,
  purchaseOrders,
  receipts,
  bills,
  journalEntries,
  paymentIntents,
  documentSequences,
  salesOrders,
  shipments,
  invoices,
  payments,
  organizations,
} from '../src/db/schema/index.js';
import { generateDeterministicId } from '../src/db/seeds/engine/utils.js';
import { subMinutes } from 'date-fns';

async function run() {
  console.log('🚀 [REFACTOR] Reconstructing 100% Activity Timeline...');

  try {
    const orgs = await db.select().from(organizations);
    const primaryOrgId = orgs[0]?.id;

    if (!primaryOrgId) {
      console.warn('⚠️ No organizations found. Activities might fail to insert.');
    }

    // --- PHASE 1: Security & Identity ---
    console.log('📦 Phase 1: Security & Identity...');
    const users = await db.select().from(user);
    for (const record of users) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: primaryOrgId,
          entityType: 'user',
          entityId: record.id,
          entityDisplayId: record.email,
          entityLabel: 'User',
          action: 'USER_CREATED',
          reason: `New user account provisioned for ${record.name}`,
          createdAt: record.createdAt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .onConflictDoNothing();
    }

    const roleRecords = await db.select().from(roles);
    for (const record of roleRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId || primaryOrgId,
          entityType: 'role',
          entityId: record.id,
          entityDisplayId: record.name,
          entityLabel: 'Role',
          action: 'ROLE_CREATED',
          reason: `System role "${record.name}" initialized with defined permissions`,
          createdAt: record.createdAt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .onConflictDoNothing();
    }

    const membershipRecords = await db.select().from(organizationMemberships);
    for (const record of membershipRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.userId, record.organizationId, 'JOINED'),
          organizationId: record.organizationId,
          entityType: 'user',
          entityId: record.userId,
          entityDisplayId: record.userId,
          entityLabel: 'User Membership',
          action: 'USER_JOINED_ORGANIZATION',
          reason: `User linked to organization with assigned role context`,
          createdAt: record.createdAt,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .onConflictDoNothing();
    }

    // --- PHASE 2: Configuration & Reference Data ---
    console.log('📦 Phase 2: Configuration & Reference Data...');
    const taxRecords = await db.select().from(taxes);
    for (const record of taxRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'tax',
          entityId: record.id,
          entityDisplayId: record.name,
          entityLabel: 'Tax',
          action: 'TAX_CONFIG_CREATED',
          reason: `Tax rule "${record.name}" (${record.rate}%) established for financial compliance`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const uomRecords = await db.select().from(unitOfMeasures);
    for (const record of uomRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'uom',
          entityId: record.id,
          entityDisplayId: record.code,
          entityLabel: 'Unit of Measure',
          action: 'UOM_CREATED',
          reason: `Unit of Measure "${record.name}" (${record.code}) defined for inventory tracking`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const catRecords = await db.select().from(productCategories);
    for (const record of catRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'product_category',
          entityId: record.id,
          entityDisplayId: record.name,
          entityLabel: 'Product Category',
          action: 'CATEGORY_CREATED',
          reason: `Product category "${record.name}" initialized in the catalog hierarchy`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // --- PHASE 3: Master Data ---
    console.log('📦 Phase 3: Master Data...');

    // Customers
    const custRecords = await db.select().from(customers);
    for (const record of custRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'customer',
          entityId: record.id,
          entityDisplayId: record.companyName,
          entityLabel: 'Customer',
          action: 'CREATED',
          reason: `Initial record created for Customer "${record.companyName}"`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // Products
    const prodRecords = await db.select().from(products);
    for (const record of prodRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'product',
          entityId: record.id,
          entityDisplayId: record.sku,
          entityLabel: 'Product',
          action: 'CREATED',
          reason: `Initial record created for Product "${record.name}"`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // Suppliers
    const suppRecords = await db.select().from(suppliers);
    for (const record of suppRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'supplier',
          entityId: record.id,
          entityDisplayId: record.name,
          entityLabel: 'Supplier',
          action: 'CREATED',
          reason: `Initial record created for Supplier "${record.name}"`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // Warehouses
    const whRecords = await db.select().from(warehouses);
    for (const record of whRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'warehouse',
          entityId: record.id,
          entityDisplayId: record.name,
          entityLabel: 'Warehouse',
          action: 'CREATED',
          reason: `Initial record created for Warehouse "${record.name}"`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const binRecords = await db.select().from(bins);
    for (const record of binRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'bin',
          entityId: record.id,
          entityDisplayId: record.code,
          entityLabel: 'Bin',
          action: 'BIN_CREATED',
          reason: `Storage bin "${record.code}" mapped within warehouse configuration`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // --- PHASE 4: Inventory & Stock ---
    console.log('📦 Phase 4: Inventory & Stock Operations...');
    const adjRecords = await db.select().from(inventoryAdjustments);
    for (const record of adjRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'ADJUSTED'),
          organizationId: record.organizationId,
          entityType: 'inventory_adjustment',
          entityId: record.id,
          entityDisplayId: record.reference || record.id,
          entityLabel: 'Inventory Adjustment',
          action: 'STOCK_ADJUSTED',
          reason: `Inventory adjustment "${record.reference || record.id}" finalized. Reason: ${record.reason || 'General Adjustment'}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // --- PHASE 5: Procure-to-Pay (P2P) ---
    console.log('📦 Phase 5: Procure-to-Pay Lifecycle...');
    const poRecords = await db.select().from(purchaseOrders);
    for (const record of poRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'purchase_order',
          entityId: record.id,
          entityDisplayId: record.documentNumber,
          entityLabel: 'Purchase Order',
          action: 'PO_CREATED',
          reason: `Purchase Order ${record.documentNumber} issued to supplier for total amount ${record.totalAmount}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const rctRecords = await db.select().from(receipts);
    for (const record of rctRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'RECEIVED'),
          organizationId: record.organizationId,
          entityType: 'receipt',
          entityId: record.id,
          entityDisplayId: record.receiptNumber,
          entityLabel: 'Receipt',
          action: 'GOODS_RECEIVED',
          reason: `Goods receipt ${record.receiptNumber} confirmed. Stock incremented in warehouse.`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const billRecords = await db.select().from(bills);
    for (const record of billRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'POSTED'),
          organizationId: record.organizationId,
          entityType: 'bill',
          entityId: record.id,
          entityDisplayId: record.documentNumber,
          entityLabel: 'Bill',
          action: 'VENDOR_BILL_POSTED',
          reason: `Vendor bill ${record.documentNumber} (Ref: ${record.referenceNumber}) recorded and approved for payment`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // --- PHASE 6: Order-to-Cash (O2C) ---
    console.log('📦 Phase 6: Order-to-Cash Lifecycle...');
    const soRecords = await db.select().from(salesOrders);
    for (const record of soRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'sales_order',
          entityId: record.id,
          entityDisplayId: record.documentNumber,
          entityLabel: 'Sales Order',
          action: 'ORDER_CREATED',
          reason: `Sales Order ${record.documentNumber} drafted for total amount ${record.totalAmount}`,
          createdAt: subMinutes(record.createdAt, 5),
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();

      if (['approved', 'partially_shipped', 'shipped'].includes(record.status)) {
        await db
          .insert(activityLogs)
          .values({
            id: generateDeterministicId(record.id, 'APPROVED'),
            organizationId: record.organizationId,
            entityType: 'sales_order',
            entityId: record.id,
            entityDisplayId: record.documentNumber,
            entityLabel: 'Sales Order',
            action: 'ORDER_APPROVED',
            reason: `Credit check passed and order approved for fulfillment`,
            createdAt: record.createdAt,
            createdBy: record.createdBy,
          })
          .onConflictDoNothing();
      }
    }

    const shpRecords = await db.select().from(shipments);
    for (const record of shpRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'SHIPPED'),
          organizationId: record.organizationId,
          entityType: 'shipment',
          entityId: record.id,
          entityDisplayId: record.shipmentNumber,
          entityLabel: 'Shipment',
          action: record.status === 'shipped' ? 'ORDER_SHIPPED' : 'SHIPMENT_CREATED',
          reason:
            record.status === 'shipped'
              ? `Goods physically dispatched via reference ${record.reference}`
              : `Shipment draft generated for Sales Order`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const invRecords = await db.select().from(invoices);
    for (const record of invRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'POSTED'),
          organizationId: record.organizationId,
          entityType: 'invoice',
          entityId: record.id,
          entityDisplayId: record.documentNumber,
          entityLabel: 'Invoice',
          action: 'INVOICE_POSTED',
          reason: `Commercial invoice ${record.documentNumber} finalized and sent to customer`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const pmtRecords = await db.select().from(payments);
    for (const record of pmtRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'RECEIVED'),
          organizationId: record.organizationId,
          entityType: 'payment',
          entityId: record.id,
          entityDisplayId: record.referenceNumber || record.id,
          entityLabel: 'Payment',
          action: record.paymentType === 'inbound' ? 'PAYMENT_RECEIVED' : 'PAYMENT_SENT',
          reason: `${record.paymentType === 'inbound' ? 'Inbound' : 'Outbound'} payment of ${record.amount} confirmed via ${record.paymentMethod}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    // --- PHASE 7: Financial Audit & Sequences ---
    console.log('📦 Phase 7: Financial Audit & Control...');
    const jeRecords = await db.select().from(journalEntries);
    for (const record of jeRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'POSTED'),
          organizationId: record.organizationId,
          entityType: 'journal_entry',
          entityId: record.id,
          entityDisplayId: record.reference || record.id,
          entityLabel: 'Journal Entry',
          action: 'LEDGER_POSTED',
          reason: `Journal entry ${record.reference || record.id} posted to General Ledger. Ref: ${record.reference}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const piRecords = await db.select().from(paymentIntents);
    for (const record of piRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'payment_intent',
          entityId: record.id,
          entityDisplayId: record.id,
          entityLabel: 'Stripe Intent',
          action: 'STRIPE_INTENT_CREATED',
          reason: `Stripe payment intent initialized for amount ${record.amount} ${record.currency}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
        })
        .onConflictDoNothing();
    }

    const seqRecords = await db.select().from(documentSequences);
    for (const record of seqRecords) {
      await db
        .insert(activityLogs)
        .values({
          id: generateDeterministicId(record.id, 'CREATED'),
          organizationId: record.organizationId,
          entityType: 'sequence',
          entityId: record.id,
          entityDisplayId: record.prefix,
          entityLabel: 'Sequence',
          action: 'SEQUENCE_INITIALIZED',
          reason: `Document numbering sequence "${record.prefix}" initialized for entity ${record.type}`,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .onConflictDoNothing();
    }

    console.log('✅ 100% Activity Timeline reconstruction complete.');
  } catch (err) {
    console.error('❌ Reconstruction failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
