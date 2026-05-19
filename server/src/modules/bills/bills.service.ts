import { db } from '../../db/index.js';
import { bills, billLines, receipts, payments, purchaseOrderLines } from '../../db/schema/index.js';
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import {
  CreateBillInput,
  UpdateBillInput,
  UpdateBillStatusInput,
} from '#shared/contracts/bills.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { sequencesService } from '../sequences/sequences.service.js';
import { BillReconciler, BillStatus } from './bills.reconciler.js';
import { ActivityLogger } from '../../lib/activity-logger.js';
import type { ActivityAction } from '#shared/config/activity-actions.config.js';

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

  private async validateThreeWayMatch(
    organizationId: string,
    purchaseOrderId: string | null | undefined,
    lines: { productId: string; quantity: string }[],
    excludeBillId?: string,
    txIn?: Transaction | typeof db,
  ) {
    if (!purchaseOrderId) return;
    const tx = txIn || db;

    // 1. Get Purchase Order Lines (ordered quantities)
    const poLines = await tx.query.purchaseOrderLines.findMany({
      where: and(
        eq(purchaseOrderLines.purchaseOrderId, purchaseOrderId),
        eq(purchaseOrderLines.organizationId, organizationId),
      ),
    });

    // 2. Get Receipts (received quantities)
    const allReceipts = await tx.query.receipts.findMany({
      where: and(
        eq(receipts.purchaseOrderId, purchaseOrderId),
        eq(receipts.organizationId, organizationId),
        sql`${receipts.deletedAt} IS NULL`,
        sql`${receipts.status} != 'cancelled'`,
      ),
      with: {
        lines: true,
      },
    });

    // 3. Get existing Bills (billed quantities), excluding excludeBillId if provided
    const allBills = await tx.query.bills.findMany({
      where: and(
        eq(bills.purchaseOrderId, purchaseOrderId),
        eq(bills.organizationId, organizationId),
        ne(bills.status, 'void'),
        excludeBillId ? ne(bills.id, excludeBillId) : undefined,
      ),
      with: {
        lines: true,
      },
    });

    // 4. Map Ordered Quantities by Product
    const orderedMap: Record<string, number> = {};
    for (const line of poLines) {
      orderedMap[line.productId] = (orderedMap[line.productId] || 0) + Number(line.quantity);
    }

    // 5. Map Received Quantities by Product
    const receivedMap: Record<string, number> = {};
    for (const receipt of allReceipts) {
      for (const line of receipt.lines) {
        receivedMap[line.productId] =
          (receivedMap[line.productId] || 0) + Number(line.quantityReceived);
      }
    }

    // 6. Map already Billed Quantities by Product
    const billedMap: Record<string, number> = {};
    for (const bill of allBills) {
      for (const line of bill.lines) {
        billedMap[line.productId] = (billedMap[line.productId] || 0) + Number(line.quantity);
      }
    }

    // 7. Map current/new Bill Quantities by Product
    const currentBilledMap: Record<string, number> = {};
    for (const line of lines) {
      currentBilledMap[line.productId] =
        (currentBilledMap[line.productId] || 0) + Number(line.quantity);
    }

    // 8. Validate each item/product on the current Bill
    for (const [productId, quantity] of Object.entries(currentBilledMap)) {
      const previouslyBilled = billedMap[productId] || 0;
      const totalBilled = previouslyBilled + quantity;
      const received = receivedMap[productId] || 0;
      const ordered = orderedMap[productId] || 0;

      if (totalBilled > received) {
        throw new Error(
          `Business Rule Violation: Billed quantity (${totalBilled}) for Product ${productId} exceeds the received quantity (${received}) from receipts linked to Purchase Order ${purchaseOrderId}.`,
        );
      }

      if (totalBilled > ordered) {
        throw new Error(
          `Business Rule Violation: Billed quantity (${totalBilled}) for Product ${productId} exceeds the ordered quantity (${ordered}) on Purchase Order ${purchaseOrderId}.`,
        );
      }
    }
  }

  async createBill(
    organizationId: string,
    userId: string,
    data: CreateBillInput,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      await this.validateThreeWayMatch(
        organizationId,
        data.purchaseOrderId,
        data.lines,
        undefined,
        tx,
      );

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

      // If created as 'open', post to GL
      if (bill.status === 'open') {
        const { PostingService } = await import('../finance/posting.service.js');
        await PostingService.postBill(bill.id, organizationId, tx);
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        entityType: 'bill',
        entityId: bill.id,
        entityDisplayId: bill.documentNumber,
        entityLabel: 'Bill',
        action: 'BILL_CREATED',
        reason: 'New bill recorded from procurement',
        userId,
      });

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

  async updateBill(organizationId: string, userId: string, id: string, data: UpdateBillInput) {
    return await db.transaction(async (tx) => {
      const existingBill = await this.getBillById(organizationId, id, tx);
      if (!existingBill) {
        throw new Error('Bill not found');
      }

      if (existingBill.status !== 'draft') {
        throw new Error('Only draft bills can be modified');
      }

      if (data.lines && existingBill.purchaseOrderId) {
        await this.validateThreeWayMatch(
          organizationId,
          existingBill.purchaseOrderId,
          data.lines,
          id,
          tx,
        );
      }

      const totalAmount =
        data.lines?.reduce((acc, line) => acc + Number(line.lineTotal), 0) ??
        Number(existingBill.totalAmount);
      const taxAmount =
        data.lines?.reduce((acc, line) => acc + Number(line.taxAmount), 0) ??
        Number(existingBill.taxAmount);

      const updateData = {
        totalAmount: totalAmount.toString(),
        balanceDue: totalAmount.toString(),
        taxAmount: taxAmount.toString(),
        notes: data.notes,
        ...(data.supplierId && { supplierId: data.supplierId }),
        ...(data.issueDate && { issueDate: data.issueDate }),
        ...(data.dueDate && { dueDate: data.dueDate }),
        ...(data.referenceNumber && { referenceNumber: data.referenceNumber }),
      };

      await tx
        .update(bills)
        .set(this.withAudit(updateData, userId, true))
        .where(and(eq(bills.id, id), eq(bills.organizationId, organizationId)));

      if (data.lines) {
        await tx
          .delete(billLines)
          .where(and(eq(billLines.billId, id), eq(billLines.organizationId, organizationId)));

        for (const line of data.lines) {
          await tx.insert(billLines).values(
            this.withAudit(
              {
                organizationId,
                billId: id,
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
      }

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          entityType: 'bill',
          entityId: id,
          entityDisplayId: existingBill.documentNumber,
          entityLabel: 'Bill',
          action: 'UPDATED',
          reason: 'Bill record modified',
          userId,
        },
        existingBill,
        updateData,
      );

      return await this.getBillById(organizationId, id, tx);
    });
  }

  async updateBillStatus(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateBillStatusInput,
  ) {
    return await db.transaction(async (tx) => {
      await BillReconciler.updateStatus(
        organizationId,
        userId,
        id,
        data.status as BillStatus,
        data.action as ActivityAction,
        data.reason,
        tx as Transaction,
      );

      return await this.getBillById(organizationId, id, tx);
    });
  }

  async deleteBill(
    organizationId: string,
    userId: string,
    id: string,
    txIn?: Transaction | typeof db,
  ) {
    const operation = async (tx: Transaction | typeof db) => {
      const bill = await tx.query.bills.findFirst({
        where: and(eq(bills.id, id), eq(bills.organizationId, organizationId)),
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      if (bill.status === 'draft') {
        // Soft-delete only
        const [updated] = await tx
          .update(bills)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(eq(bills.id, id), eq(bills.organizationId, organizationId)))
          .returning();
        return updated;
      } else {
        // Check for completed payments
        const existingPayments = await tx.query.payments.findMany({
          where: and(
            eq(payments.billId, id),
            eq(payments.organizationId, organizationId),
            eq(payments.status, 'completed'),
            sql`${payments.deletedAt} IS NULL`,
          ),
        });

        if (existingPayments.length > 0) {
          throw new Error(
            'Cannot void bill with existing completed payments. Void the payments first.',
          );
        }

        await BillReconciler.updateStatus(
          organizationId,
          userId,
          id,
          'void',
          'VOIDED',
          'Bill manually voided',
          tx as Transaction,
        );
        return await this.getBillById(organizationId, id, tx);
      }
    };

    if (txIn) {
      return await operation(txIn);
    }

    return await db.transaction(async (tx) => {
      return await operation(tx);
    });
  }

  async bulkDeleteBills(organizationId: string, userId: string, ids: string[]) {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const id of ids) {
        results.push(await this.deleteBill(organizationId, userId, id, tx));
      }
      return results;
    });
  }
}

export const billsService = new BillsService();
