import { z } from 'zod';

export const invoiceStatusEnumSchema = z.enum(['draft', 'open', 'partially_paid', 'paid', 'void']);

export const invoiceLineInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.string().min(1, 'Quantity is required'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  taxRateAtOrder: z.string().min(1, 'Tax rate is required'),
  taxAmount: z.string().min(1, 'Tax amount is required'),
  lineTotal: z.string().min(1, 'Line total is required'),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  salesOrderId: z.string().uuid().optional().nullable(),
  issueDate: z.date().or(z.string().pipe(z.coerce.date())),
  dueDate: z.date().or(z.string().pipe(z.coerce.date())),
  lines: z.array(invoiceLineInputSchema).min(1, 'At least one line is required'),
  notes: z.string().max(1000).optional().nullable(),
  status: invoiceStatusEnumSchema.default('draft'),
  balanceDue: z.string().optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  status: invoiceStatusEnumSchema,
  action: z.string().min(1, 'Action is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export type InvoiceStatus = z.infer<typeof invoiceStatusEnumSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
