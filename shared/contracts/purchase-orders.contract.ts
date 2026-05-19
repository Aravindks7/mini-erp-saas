import { z } from 'zod';

export const purchaseOrderStatusEnumSchema = z.enum([
  'draft',
  'sent',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]);

export const purchaseOrderLineInputSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  quantity: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Quantity must be a valid number')
    .refine((val) => Number(val) > 0, 'Quantity must be positive'),
  unitPrice: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Unit price must be a valid number')
    .refine((val) => Number(val) >= 0, 'Unit price cannot be negative'),
  taxRateAtOrder: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Tax rate must be a valid number')
    .refine((val) => Number(val) >= 0, 'Tax rate cannot be negative'),
  taxAmount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Tax amount must be a valid number')
    .refine((val) => Number(val) >= 0, 'Tax amount cannot be negative'),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid('Invalid Supplier ID'),
  lines: z.array(purchaseOrderLineInputSchema).min(1, 'At least one line is required'),
});

export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineInputSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.extend({
  reason: z.string().optional(),
});

export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusEnumSchema,
  action: z.string().min(1, 'Action is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export type UpdatePurchaseOrderStatusInput = z.infer<typeof updatePurchaseOrderStatusSchema>;
