import { db } from '../../db/index.js';
import { invoices, invoiceLines, salesOrders } from '../../db/schema/index.js';
import { and, desc, eq } from 'drizzle-orm';
import {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '#shared/contracts/invoices.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';

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
    const [updated] = await db
      .update(invoices)
      .set(this.withAudit({ status: data.status }, userId, true))
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)))
      .returning();

    return updated;
  }
}

export const invoicesService = new InvoicesService();
