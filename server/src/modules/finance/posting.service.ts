import { db } from '../../db/index.js';
import { journalEntries, journalEntryLines } from '../../db/schema/index.js';

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
  static async postInvoice(invoiceId: string, organizationId: string) {
    const invoice = await db.query.invoices.findFirst({
      where: (inv, { and, eq }) =>
        and(eq(inv.id, invoiceId), eq(inv.organizationId, organizationId)),
      with: {
        customer: true,
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'draft') return; // Don't post drafts

    const arAccount = await this.getAccountByCode('1200', organizationId);
    const revenueAccount = await this.getAccountByCode('4000', organizationId);

    if (!arAccount || !revenueAccount) {
      console.warn(
        `[PostingService] Missing accounts for Invoice ${invoiceId}. Skipping GL entry.`,
      );
      return;
    }

    return await db.transaction(async (tx) => {
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
    });
  }

  /**
   * Post a Payment to the General Ledger.
   * If Inbound (Customer Payment): Dr Bank, Cr Accounts Receivable
   * If Outbound (Supplier Payment): Dr Accounts Payable, Cr Bank
   */
  static async postPayment(paymentId: string, organizationId: string) {
    const payment = await db.query.payments.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, paymentId), eq(p.organizationId, organizationId)),
    });

    if (!payment) throw new Error('Payment not found');
    if (payment.status !== 'completed') return;

    const bankAccount = await this.getAccountByCode('1020', organizationId);

    return await db.transaction(async (tx) => {
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
        const arAccount = await this.getAccountByCode('1200', organizationId);
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
        const apAccount = await this.getAccountByCode('2000', organizationId);
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
    });
  }

  /**
   * Post a Bill to the General Ledger.
   * Dr Expense / Inventory
   * Cr Accounts Payable
   */
  static async postBill(billId: string, organizationId: string) {
    const bill = await db.query.bills.findFirst({
      where: (b, { and, eq }) => and(eq(b.id, billId), eq(b.organizationId, organizationId)),
      with: {
        supplier: true,
      },
    });

    if (!bill) throw new Error('Bill not found');
    if (bill.status === 'draft') return;

    const apAccount = await this.getAccountByCode('2000', organizationId);
    const expenseAccount = await this.getAccountByCode('5100', organizationId);

    if (!apAccount || !expenseAccount) {
      console.warn(`[PostingService] Missing accounts for Bill ${billId}. Skipping GL entry.`);
      return;
    }

    return await db.transaction(async (tx) => {
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

      // Dr Expense
      await tx.insert(journalEntryLines).values({
        organizationId,
        journalEntryId: entry.id,
        accountId: expenseAccount.id,
        debit: bill.totalAmount,
        credit: '0',
        description: `Expense for ${bill.documentNumber}`,
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
    });
  }

  private static accountCache: Map<string, { id: string; code: string; name: string }> = new Map();

  private static async getAccountByCode(code: string, organizationId: string) {
    const cacheKey = `${organizationId}:${code}`;
    const cached = this.accountCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const account = await db.query.accounts.findFirst({
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
