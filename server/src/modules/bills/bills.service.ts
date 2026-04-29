import { db } from '../../db/index.js';
import { bills, billLines, receipts } from '../../db/schema/index.js';
import { and, desc, eq } from 'drizzle-orm';
import { CreateBillInput, UpdateBillStatusInput } from '#shared/contracts/bills.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class BillsService extends BaseService<typeof bills> {
  constructor() {
    super(bills);
  }

  async listBills(organizationId: string) {
    return await db.query.bills.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        supplier: true,
        receipt: true,
        purchaseOrder: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
      orderBy: [desc(bills.createdAt)],
    });
  }

  async getBillById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.bills.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        supplier: true,
        receipt: true,
        purchaseOrder: true,
        lines: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  async createBill(
    organizationId: string,
    userId: string,
    data: CreateBillInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      const documentNumber = await sequencesService.getNextSequence(
        organizationId,
        'BIL',
        userId,
        tx,
      );

      const totalAmount = data.lines.reduce((acc, line) => acc + Number(line.lineTotal), 0);
      const taxAmount = data.lines.reduce((acc, line) => acc + Number(line.taxAmount), 0);

      const [bill] = await tx
        .insert(bills)
        .values(
          this.withAudit(
            {
              organizationId,
              supplierId: data.supplierId,
              receiptId: data.receiptId,
              purchaseOrderId: data.purchaseOrderId,
              documentNumber,
              referenceNumber: data.referenceNumber,
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

      if (!bill) {
        throw new Error('Failed to create bill header');
      }

      for (const line of data.lines) {
        await tx.insert(billLines).values(
          this.withAudit(
            {
              organizationId,
              billId: bill.id,
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

      return await this.getBillById(organizationId, bill.id, tx);
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  async createFromReceipt(organizationId: string, userId: string, receiptId: string) {
    return await db.transaction(async (tx) => {
      const receipt = await tx.query.receipts.findFirst({
        where: and(eq(receipts.id, receiptId), eq(receipts.organizationId, organizationId)),
        with: {
          lines: {
            with: {
              purchaseOrderLine: true,
            },
          },
          purchaseOrder: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      // Default due date to 30 days from now
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const billData: CreateBillInput = {
        supplierId: receipt.purchaseOrder!.supplierId,
        receiptId: receipt.id,
        purchaseOrderId: receipt.purchaseOrderId,
        referenceNumber: `PO-REF-${receipt.purchaseOrder!.documentNumber}`, // Placeholder
        issueDate,
        dueDate,
        status: 'draft',
        lines: receipt.lines.map((line) => {
          const poLine = line.purchaseOrderLine!;
          const subtotal = Number(line.quantityReceived) * Number(poLine.unitPrice);
          const tax = (subtotal * Number(poLine.taxRateAtOrder)) / 100;

          return {
            productId: line.productId,
            quantity: line.quantityReceived,
            unitPrice: poLine.unitPrice,
            taxRateAtOrder: poLine.taxRateAtOrder,
            taxAmount: tax.toFixed(8),
            lineTotal: (subtotal + tax).toFixed(8),
          };
        }),
      };

      return await this.createBill(organizationId, userId, billData, tx);
    });
  }

  async updateBillStatus(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateBillStatusInput,
  ) {
    const [updated] = await db
      .update(bills)
      .set(this.withAudit({ status: data.status }, userId, true))
      .where(and(eq(bills.id, id), eq(bills.organizationId, organizationId)))
      .returning();

    return updated;
  }
}

export const billsService = new BillsService();
