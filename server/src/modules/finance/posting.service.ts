import { db } from '../../db/index.js';
import { journalEntries, journalEntryLines, accounts } from '../../db/schema/index.js';
import { SEED_DATA } from '../../db/seeds/constants.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Posting Service: The "Engine" of the ERP.
 * Translates operational business events (Invoices, Bills, Payments) into
 * the General Ledger using double-entry bookkeeping principles.
 */
export class PostingService {
  /**
   * Post an Invoice to the General Ledger.
   * Dr Accounts Receivable
   * Cr Sales Revenue
   */
  static async postInvoice(invoiceId: string, organizationId: string, tx: Transaction | typeof db) {
    const context = tx;
    const invoice = await context.query.invoices.findFirst({
      where: (inv, { and, eq }) =>
        and(eq(inv.id, invoiceId), eq(inv.organizationId, organizationId)),
      with: {
        customer: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'draft') return; // Don't post drafts

    const arAccount = await this.getAccountByCode('1200', organizationId, context);
    const revenueAccount = await this.getAccountByCode('4000', organizationId, context);

    if (!arAccount || !revenueAccount) {
      console.warn(
        `[PostingService] Missing accounts for Invoice ${invoiceId}. Skipping GL entry.`,
      );
      return;
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: invoice.issueDate,
        reference: invoice.documentNumber,
        description: `Sales Invoice: ${invoice.customer?.companyName}`,
        status: 'posted',
        createdBy: invoice.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    // Dr Accounts Receivable
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: arAccount.id,
      debit: invoice.totalAmount,
      credit: '0',
      description: `AR for ${invoice.documentNumber}`,
    });

    // Cr Sales Revenue
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: revenueAccount.id,
      debit: '0',
      credit: invoice.totalAmount,
      description: `Revenue for ${invoice.documentNumber}`,
    });

    return entry;
  }

  /**
   * Post an Invoice Reversal to the General Ledger.
   * Dr Sales Revenue
   * Cr Accounts Receivable
   */
  static async postInvoiceReversal(
    invoiceId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const context = tx;
    const invoice = await context.query.invoices.findFirst({
      where: (inv, { and, eq }) =>
        and(eq(inv.id, invoiceId), eq(inv.organizationId, organizationId)),
      with: {
        customer: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    const existingEntry = await context.query.journalEntries.findFirst({
      where: (je, { and, eq }) =>
        and(eq(je.organizationId, organizationId), eq(je.reference, invoice.documentNumber)),
    });

    if (!existingEntry) {
      console.warn(
        `[PostingService] No existing journal entry found for Invoice ${invoice.documentNumber}. Skipping GL reversal.`,
      );
      return;
    }

    const arAccount = await this.getAccountByCode('1200', organizationId, context);
    const revenueAccount = await this.getAccountByCode('4000', organizationId, context);

    if (!arAccount || !revenueAccount) {
      console.warn(
        `[PostingService] Missing accounts for Invoice Reversal ${invoiceId}. Skipping GL entry.`,
      );
      return;
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: new Date(),
        reference: `${invoice.documentNumber}-REV`,
        description: `REVERSAL of Sales Invoice: ${invoice.customer?.companyName}`,
        status: 'posted',
        createdBy: invoice.updatedBy || invoice.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    // Dr Sales Revenue
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: revenueAccount.id,
      debit: invoice.totalAmount,
      credit: '0',
      description: `Revenue Reversal for Void ${invoice.documentNumber}`,
    });

    // Cr Accounts Receivable
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: arAccount.id,
      debit: '0',
      credit: invoice.totalAmount,
      description: `AR Reversal for Void ${invoice.documentNumber}`,
    });

    return entry;
  }

  /**
   * Post a Payment to the General Ledger.
   * If Inbound (Customer Payment): Dr Bank, Cr Accounts Receivable
   * If Outbound (Supplier Payment): Dr Accounts Payable, Cr Bank
   */
  static async postPayment(paymentId: string, organizationId: string, tx: Transaction | typeof db) {
    const context = tx;
    const payment = await context.query.payments.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, paymentId), eq(p.organizationId, organizationId)),
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'completed') return;

    const bankAccount = await this.getAccountByCode('1020', organizationId, context);

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: payment.paymentDate,
        reference: payment.referenceNumber,
        description: `Payment ${payment.paymentType === 'inbound' ? 'In' : 'Out'}: ${payment.referenceNumber}`,
        status: 'posted',
        createdBy: payment.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    if (payment.paymentType === 'inbound') {
      const arAccount = await this.getAccountByCode('1200', organizationId, tx);
      if (!bankAccount || !arAccount) return;

      // Dr Bank
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: bankAccount.id,
        debit: payment.amount,
        credit: '0',
      });

      // Cr Accounts Receivable
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: arAccount.id,
        debit: '0',
        credit: payment.amount,
      });
    } else {
      const apAccount = await this.getAccountByCode('2000', organizationId, tx);
      if (!bankAccount || !apAccount) return;

      // Dr Accounts Payable
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: apAccount.id,
        debit: payment.amount,
        credit: '0',
      });

      // Cr Bank
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: bankAccount.id,
        debit: '0',
        credit: payment.amount,
      });
    }

    return entry;
  }

  /**
   * Post a Payment Reversal to the General Ledger.
   * If Inbound (Customer Payment Cancelled): Dr Accounts Receivable, Cr Bank
   * If Outbound (Supplier Payment Cancelled): Dr Bank, Cr Accounts Payable
   */
  static async postPaymentReversal(
    paymentId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const context = tx;
    const payment = await context.query.payments.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, paymentId), eq(p.organizationId, organizationId)),
    });

    if (!payment) throw new Error('Payment not found');

    if (!payment.referenceNumber) {
      console.warn(
        `[PostingService] Missing reference number for Payment ${paymentId}. Skipping GL reversal.`,
      );
      return;
    }

    const existingEntry = await context.query.journalEntries.findFirst({
      where: (je, { and, eq }) =>
        and(
          eq(je.organizationId, organizationId),
          eq(je.reference, payment.referenceNumber as string),
        ),
    });

    if (!existingEntry) {
      console.warn(
        `[PostingService] No existing journal entry found for Payment ${payment.referenceNumber}. Skipping GL reversal.`,
      );
      return;
    }

    const bankAccount = await this.getAccountByCode('1020', organizationId, context);

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: new Date(),
        reference: `${payment.referenceNumber}-REV`,
        description: `REVERSAL of Payment ${payment.paymentType === 'inbound' ? 'In' : 'Out'}: ${payment.referenceNumber}`,
        status: 'posted',
        createdBy: payment.updatedBy || payment.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    if (payment.paymentType === 'inbound') {
      const arAccount = await this.getAccountByCode('1200', organizationId, tx);
      if (!bankAccount || !arAccount) return;

      // Dr Accounts Receivable
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: arAccount.id,
        debit: payment.amount,
        credit: '0',
        description: `AR Reinstatement for Void Payment ${payment.referenceNumber}`,
      });

      // Cr Bank
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: bankAccount.id,
        debit: '0',
        credit: payment.amount,
        description: `Cash Reversal for Void Payment ${payment.referenceNumber}`,
      });
    } else {
      const apAccount = await this.getAccountByCode('2000', organizationId, tx);
      if (!bankAccount || !apAccount) return;

      // Dr Bank
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: bankAccount.id,
        debit: payment.amount,
        credit: '0',
        description: `Cash Reinstatement for Void Payment ${payment.referenceNumber}`,
      });

      // Cr Accounts Payable
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: apAccount.id,
        debit: '0',
        credit: payment.amount,
        description: `AP Reinstatement for Void Payment ${payment.referenceNumber}`,
      });
    }

    return entry;
  }

  /**
   * Post a Bill to the General Ledger.
   * Dr Expense / Inventory
   * Cr Accounts Payable
   */
  static async postBill(billId: string, organizationId: string, tx: Transaction | typeof db) {
    const context = tx;
    const bill = await context.query.bills.findFirst({
      where: (b, { and, eq }) => and(eq(b.id, billId), eq(b.organizationId, organizationId)),
      with: {
        supplier: true,
      },
    });

    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'draft') return;

    const apAccount = await this.getAccountByCode('2000', organizationId, context);
    const expenseAccount = await this.getAccountByCode('5000', organizationId, context);

    if (!apAccount || !expenseAccount) {
      console.warn(`[PostingService] Missing accounts for Bill ${billId}. Skipping GL entry.`);
      return;
    }

    let targetDebitAccount = expenseAccount;
    if (bill.purchaseOrderId) {
      const clearingAccount = await this.getAccountByCode('2100', organizationId, context);
      if (clearingAccount) {
        targetDebitAccount = clearingAccount;
      }
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: bill.issueDate,
        reference: bill.documentNumber,
        description: `Supplier Bill: ${bill.supplier?.name}`,
        status: 'posted',
        createdBy: bill.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    // Dr Expense / Inventory Clearing
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: targetDebitAccount.id,
      debit: bill.totalAmount,
      credit: '0',
      description: `Debit allocation for ${bill.documentNumber}`,
    });

    // Cr Accounts Payable
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: apAccount.id,
      debit: '0',
      credit: bill.totalAmount,
      description: `AP for ${bill.documentNumber}`,
    });

    return entry;
  }

  /**
   * Post a Bill Reversal to the General Ledger.
   * Dr Accounts Payable
   * Cr Expense / Inventory Clearing
   */
  static async postBillReversal(
    billId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const context = tx;
    const bill = await context.query.bills.findFirst({
      where: (b, { and, eq }) => and(eq(b.id, billId), eq(b.organizationId, organizationId)),
      with: {
        supplier: true,
      },
    });

    if (!bill) throw new Error('Bill not found');

    const existingEntry = await context.query.journalEntries.findFirst({
      where: (je, { and, eq }) =>
        and(eq(je.organizationId, organizationId), eq(je.reference, bill.documentNumber)),
    });

    if (!existingEntry) {
      console.warn(
        `[PostingService] No existing journal entry found for Bill ${bill.documentNumber}. Skipping GL reversal.`,
      );
      return;
    }

    const apAccount = await this.getAccountByCode('2000', organizationId, context);
    const expenseAccount = await this.getAccountByCode('5000', organizationId, context);

    if (!apAccount || !expenseAccount) {
      console.warn(
        `[PostingService] Missing accounts for Bill Reversal ${billId}. Skipping GL entry.`,
      );
      return;
    }

    let targetCreditAccount = expenseAccount;
    if (bill.purchaseOrderId) {
      const clearingAccount = await this.getAccountByCode('2100', organizationId, context);
      if (clearingAccount) {
        targetCreditAccount = clearingAccount;
      }
    }

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: new Date(),
        reference: `${bill.documentNumber}-REV`,
        description: `REVERSAL of Supplier Bill: ${bill.supplier?.name}`,
        status: 'posted',
        createdBy: bill.updatedBy || bill.createdBy,
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry');

    // Dr Accounts Payable
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: apAccount.id,
      debit: bill.totalAmount,
      credit: '0',
      description: `AP Reversal for Void ${bill.documentNumber}`,
    });

    // Cr Expense / Inventory Clearing
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: targetCreditAccount.id,
      debit: '0',
      credit: bill.totalAmount,
      description: `Clearing Reversal for Void ${bill.documentNumber}`,
    });

    return entry;
  }

  /**
   * Post a Receipt Material Intake to the General Ledger.
   * Dr Inventory Asset
   * Cr Inventory Clearing
   */
  static async postReceipt(receiptId: string, organizationId: string, tx: Transaction | typeof db) {
    const receipt = await tx.query.receipts.findFirst({
      where: (r, { and, eq }) => and(eq(r.id, receiptId), eq(r.organizationId, organizationId)),
      with: {
        lines: {
          with: {
            purchaseOrderLine: true,
          },
        },
        purchaseOrder: true,
      },
    });

    if (!receipt || !receipt.lines || receipt.lines.length === 0) return;

    const inventoryAccount = await this.getAccountByCode('1400', organizationId, tx);
    let clearingAccount = await this.getAccountByCode('2100', organizationId, tx);

    if (!clearingAccount) {
      // Dynamically initialize it for this organization
      const [newAcc] = await tx
        .insert(accounts)
        .values({
          id: SEED_DATA.ACCOUNTS.INVENTORY_CLEARING,
          organizationId,
          name: 'Inventory Clearing',
          code: '2100',
          type: 'liability',
          isActive: true,
          createdBy: 'system',
          updatedBy: 'system',
        })
        .onConflictDoNothing()
        .returning();
      clearingAccount = newAcc || (await this.getAccountByCode('2100', organizationId, tx));
    }

    if (!inventoryAccount || !clearingAccount) {
      console.warn(
        `[PostingService] Missing accounts for Receipt ${receiptId}. Skipping GL entry.`,
      );
      return;
    }

    let totalCost = 0;
    for (const line of receipt.lines) {
      const quantity = Number(line.quantityReceived);
      const unitPrice = line.purchaseOrderLine ? Number(line.purchaseOrderLine.unitPrice) : 0;
      totalCost += quantity * unitPrice;
    }

    if (totalCost <= 0) return;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: receipt.receivedDate || new Date(),
        reference: receipt.receiptNumber,
        description: `Material Intake: ${receipt.receiptNumber} (PO: ${receipt.purchaseOrder?.documentNumber})`,
        status: 'posted',
        createdBy: receipt.createdBy || 'system',
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry for receipt');

    // Dr Inventory Asset
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: inventoryAccount.id,
      debit: totalCost.toString(),
      credit: '0',
      description: `Inventory In for Receipt ${receipt.receiptNumber}`,
    });

    // Cr Inventory Clearing
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: clearingAccount.id,
      debit: '0',
      credit: totalCost.toString(),
      description: `Inventory Clearing for Receipt ${receipt.receiptNumber}`,
    });

    return entry;
  }

  /**
   * Post a Receipt Reversal to the General Ledger.
   * Dr Inventory Clearing
   * Cr Inventory Asset
   */
  static async postReceiptReversal(
    receiptId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const receipt = await tx.query.receipts.findFirst({
      where: (r, { and, eq }) => and(eq(r.id, receiptId), eq(r.organizationId, organizationId)),
      with: {
        lines: {
          with: {
            purchaseOrderLine: true,
          },
        },
        purchaseOrder: true,
      },
    });

    if (!receipt || !receipt.lines || receipt.lines.length === 0) return;

    const inventoryAccount = await this.getAccountByCode('1400', organizationId, tx);
    const clearingAccount = await this.getAccountByCode('2100', organizationId, tx);

    if (!inventoryAccount || !clearingAccount) return;

    let totalCost = 0;
    for (const line of receipt.lines) {
      const quantity = Number(line.quantityReceived);
      const unitPrice = line.purchaseOrderLine ? Number(line.purchaseOrderLine.unitPrice) : 0;
      totalCost += quantity * unitPrice;
    }

    if (totalCost <= 0) return;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: new Date(),
        reference: `REV-${receipt.receiptNumber}`,
        description: `Reversal - Material Intake: ${receipt.receiptNumber}`,
        status: 'posted',
        createdBy: receipt.createdBy || 'system',
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry for receipt reversal');

    // Dr Inventory Clearing
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: clearingAccount.id,
      debit: totalCost.toString(),
      credit: '0',
      description: `Reversal Inventory Clearing for Receipt ${receipt.receiptNumber}`,
    });

    // Cr Inventory Asset
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: inventoryAccount.id,
      debit: '0',
      credit: totalCost.toString(),
      description: `Reversal Inventory In for Receipt ${receipt.receiptNumber}`,
    });

    return entry;
  }

  /**
   * Post a Shipment Outbound stock exit to the General Ledger.
   * Dr Cost of Goods Sold
   * Cr Inventory Asset
   */
  static async postShipment(
    shipmentId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const shipment = await tx.query.shipments.findFirst({
      where: (s, { and, eq }) => and(eq(s.id, shipmentId), eq(s.organizationId, organizationId)),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!shipment || !shipment.lines || shipment.lines.length === 0) return;

    const cogsAccount = await this.getAccountByCode('5000', organizationId, tx);
    const inventoryAccount = await this.getAccountByCode('1400', organizationId, tx);

    if (!cogsAccount || !inventoryAccount) {
      console.warn(
        `[PostingService] Missing accounts for Shipment ${shipmentId}. Skipping GL entry.`,
      );
      return;
    }

    let totalCost = 0;
    for (const line of shipment.lines) {
      const quantity = Number(line.quantityShipped);
      const unitCost = Number(line.product.basePrice) * 0.7; // Standard Cost Valuation (70% of basePrice)
      totalCost += quantity * unitCost;
    }

    if (totalCost <= 0) return;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: shipment.shipmentDate || new Date(),
        reference: shipment.shipmentNumber,
        description: `Product Shipment: ${shipment.shipmentNumber}`,
        status: 'posted',
        createdBy: shipment.createdBy || 'system',
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry for shipment');

    // Dr COGS
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: cogsAccount.id,
      debit: totalCost.toString(),
      credit: '0',
      description: `COGS for Shipment ${shipment.shipmentNumber}`,
    });

    // Cr Inventory Asset
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: inventoryAccount.id,
      debit: '0',
      credit: totalCost.toString(),
      description: `Inventory Out for Shipment ${shipment.shipmentNumber}`,
    });

    return entry;
  }

  /**
   * Post a Shipment Reversal to the General Ledger.
   * Dr Inventory Asset
   * Cr Cost of Goods Sold
   */
  static async postShipmentReversal(
    shipmentId: string,
    organizationId: string,
    tx: Transaction | typeof db,
  ) {
    const shipment = await tx.query.shipments.findFirst({
      where: (s, { and, eq }) => and(eq(s.id, shipmentId), eq(s.organizationId, organizationId)),
      with: {
        lines: {
          with: {
            product: true,
          },
        },
      },
    });

    if (!shipment || !shipment.lines || shipment.lines.length === 0) return;

    const cogsAccount = await this.getAccountByCode('5000', organizationId, tx);
    const inventoryAccount = await this.getAccountByCode('1400', organizationId, tx);

    if (!cogsAccount || !inventoryAccount) return;

    let totalCost = 0;
    for (const line of shipment.lines) {
      const quantity = Number(line.quantityShipped);
      const unitCost = Number(line.product.basePrice) * 0.7;
      totalCost += quantity * unitCost;
    }

    if (totalCost <= 0) return;

    const [entry] = await tx
      .insert(journalEntries)
      .values({
        organizationId,
        date: new Date(),
        reference: `REV-${shipment.shipmentNumber}`,
        description: `Reversal - Product Shipment: ${shipment.shipmentNumber}`,
        status: 'posted',
        createdBy: shipment.createdBy || 'system',
      })
      .returning();

    if (!entry) throw new Error('Failed to create journal entry for shipment reversal');

    // Dr Inventory Asset
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: inventoryAccount.id,
      debit: totalCost.toString(),
      credit: '0',
      description: `Reversal Inventory Out for Shipment ${shipment.shipmentNumber}`,
    });

    // Cr COGS
    await tx.insert(journalEntryLines).values({
      organizationId,
      journalEntryId: entry.id,
      accountId: cogsAccount.id,
      debit: '0',
      credit: totalCost.toString(),
      description: `Reversal COGS for Shipment ${shipment.shipmentNumber}`,
    });

    return entry;
  }

  private static accountCache: Map<string, { id: string; code: string; name: string }> = new Map();

  private static async getAccountByCode(
    code: string,
    organizationId: string,
    context: Transaction | typeof db = db,
  ) {
    const cacheKey = `${organizationId}:${code}`;
    const cached = this.accountCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const account = await context.query.accounts.findFirst({
      where: (acc, { and, eq }) => and(eq(acc.code, code), eq(acc.organizationId, organizationId)),
    });

    if (account) {
      this.accountCache.set(cacheKey, {
        id: account.id,
        code: account.code,
        name: account.name,
      });
    }

    return account;
  }
}
