import { z } from 'zod';

export const receiptStatusEnumSchema = z.enum(['draft', 'received', 'cancelled']);

export const receiptLineInputSchema = z.object({
  purchaseOrderLineId: z.string().uuid('Invalid PO Line ID').optional().nullable(),
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  binId: z.string().uuid('Invalid Bin ID').optional().nullable(),
  quantityReceived: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Quantity must be a valid number')
    .refine((val) => Number(val) > 0, 'Quantity must be positive'),
});

export const createReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid('Invalid PO ID').optional().nullable(),
  receivedDate: z.string().optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  lines: z.array(receiptLineInputSchema).min(1, 'At least one line is required'),
});

export type ReceiptLineInput = z.infer<typeof receiptLineInputSchema>;
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
