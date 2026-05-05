import { db } from '../../db/index.js';
import { invoices, invoiceLines, salesOrders, payments } from '../../db/schema/index.js';
import { and, desc, eq } from 'drizzle-orm';
import {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '#shared/contracts/invoices.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { InvoiceReconciler, InvoiceStatus } from './invoices.reconciler.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class InvoicesService extends BaseService<typeof invoices> {
  constructor() {
    super(invoices);
  }

  async listInvoices(organizationId: string) {
    return await db.query.invoices.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        customer: true,
        salesOrder: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(invoices.createdAt)],
    });
  }

  async getInvoiceById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.invoices.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        customer: true,
        salesOrder: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  async deleteInvoice(
    organizationId: string,
    userId: string,
    id: string,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      const invoice = await this.getInvoiceById(organizationId, id, tx);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'draft') {
        // Soft-delete
        await tx
          .update(invoices)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));

        // Soft-delete lines as well
        await tx
          .update(invoiceLines)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(
            and(eq(invoiceLines.invoiceId, id), eq(invoiceLines.organizationId, organizationId)),
          );
      } else {
        // Check for completed payments
        const completedPayment = await tx.query.payments.findFirst({
          where: and(
            eq(payments.invoiceId, id),
            eq(payments.organizationId, organizationId),
            eq(payments.status, 'completed'),
          ),
        });

        if (completedPayment) {
          throw new Error(
            'Cannot void invoice with existing completed payments. Void the payments first.',
          );
        }

        // Void invoice using reconciler
        await InvoiceReconciler.updateStatus(
          organizationId,
          userId,
          id,
          'void',
          'Invoice manually voided',
          tx as Transaction,
        );
      }

      return { id };
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  async bulkDeleteInvoices(organizationId: string, userId: string, ids: string[]) {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const id of ids) {
        results.push(await this.deleteInvoice(organizationId, userId, id, tx));
      }
      return results;
    });
  }

  async createInvoice(
    organizationId: string,
    userId: string,
    data: CreateInvoiceInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      const documentNumber = await sequencesService.getNextSequence(
        organizationId,
        'INV',
        userId,
        tx,
      );

      const totalAmount = data.lines.reduce((acc, line) => acc + Number(line.lineTotal), 0);
      const taxAmount = data.lines.reduce((acc, line) => acc + Number(line.taxAmount), 0);

      const [invoice] = await tx
        .insert(invoices)
        .values(
          this.withAudit(
            {
              organizationId,
              customerId: data.customerId,
              salesOrderId: data.salesOrderId,
              documentNumber,
              status: data.status || 'draft',
              issueDate: data.issueDate,
              dueDate: data.dueDate,
              totalAmount: totalAmount.toString(),
              balanceDue: totalAmount.toString(),
              taxAmount: taxAmount.toString(),
              notes: data.notes,
            },
            userId,
          ),
        )
        .returning();

      if (!invoice) {
        throw new Error('Failed to create invoice header');
      }

      for (const line of data.lines) {
        await tx.insert(invoiceLines).values(
          this.withAudit(
            {
              organizationId,
              invoiceId: invoice.id,
              productId: line.productId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRateAtOrder: line.taxRateAtOrder,
              taxAmount: line.taxAmount,
              lineTotal: line.lineTotal,
            },
            userId,
          ),
        );
      }

      // If created as 'open', post to GL
      if (invoice.status === 'open') {
        const { PostingService } = await import('../finance/posting.service.js');
        await PostingService.postInvoice(invoice.id, organizationId, tx);
      }

      return await this.getInvoiceById(organizationId, invoice.id, tx);
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  async createFromSalesOrder(organizationId: string, userId: string, salesOrderId: string) {
    return await db.transaction(async (tx) => {
      const so = await tx.query.salesOrders.findFirst({
        where: and(
          eq(salesOrders.id, salesOrderId),
          eq(salesOrders.organizationId, organizationId),
        ),
        with: {
          lines: true,
        },
      });

      if (!so) {
        throw new Error('Sales order not found');
      }

      // Default due date to 30 days from now
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoiceData: CreateInvoiceInput = {
        customerId: so.customerId,
        salesOrderId: so.id,
        issueDate,
        dueDate,
        status: 'draft',
        lines: so.lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRateAtOrder: line.taxRateAtOrder,
          taxAmount: line.taxAmount,

          lineTotal: (
            Number(line.quantity) * Number(line.unitPrice) +
            Number(line.taxAmount)
          ).toString(),
        })),
      };

      return await this.createInvoice(organizationId, userId, invoiceData, tx);
    });
  }

  async updateInvoiceStatus(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateInvoiceStatusInput,
  ) {
    return await db.transaction(async (tx) => {
      await InvoiceReconciler.updateStatus(
        organizationId,
        userId,
        id,
        data.status as InvoiceStatus,
        'Manual status update',
        tx as Transaction,
      );

      return await this.getInvoiceById(organizationId, id, tx);
    });
  }
}

export const invoicesService = new InvoicesService();
