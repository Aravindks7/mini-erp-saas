import { z } from 'zod';

export const billStatusEnumSchema = z.enum(['draft', 'open', 'paid', 'void']);

export const billLineInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.string().min(1, 'Quantity is required'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  taxRateAtOrder: z.string().min(1, 'Tax rate is required'),
  taxAmount: z.string().min(1, 'Tax amount is required'),
  lineTotal: z.string().min(1, 'Line total is required'),
});

export const createBillSchema = z.object({
  supplierId: z.string().uuid(),
  receiptId: z.string().uuid().optional().nullable(),
  purchaseOrderId: z.string().uuid().optional().nullable(),
  referenceNumber: z.string().min(1, 'Vendor reference number is required'),
  issueDate: z.date().or(z.string().pipe(z.coerce.date())),
  dueDate: z.date().or(z.string().pipe(z.coerce.date())),
  lines: z.array(billLineInputSchema).min(1, 'At least one line is required'),
  notes: z.string().max(1000).optional().nullable(),
  status: billStatusEnumSchema.default('draft'),
});

export const updateBillSchema = createBillSchema.partial();

export const updateBillStatusSchema = z.object({
  status: billStatusEnumSchema,
});

export type BillStatus = z.infer<typeof billStatusEnumSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type UpdateBillStatusInput = z.infer<typeof updateBillStatusSchema>;
