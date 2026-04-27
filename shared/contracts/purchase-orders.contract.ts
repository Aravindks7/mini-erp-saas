import { z } from 'zod';

export const purchaseOrderStatusEnumSchema = z.enum(['draft', 'sent', 'received', 'cancelled']);

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

export const receivePurchaseOrderLineInputSchema = z.object({
  purchaseOrderLineId: z.string().uuid('Invalid PO Line ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  binId: z.string().uuid('Invalid Bin ID').optional().nullable(),
  quantityReceived: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Quantity must be a valid number')
    .refine((val) => Number(val) > 0, 'Quantity must be positive'),
});

export const receivePurchaseOrderSchema = z.object({
  lines: z.array(receivePurchaseOrderLineInputSchema).min(1, 'At least one line is required'),
});

export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineInputSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type ReceivePurchaseOrderLineInput = z.infer<typeof receivePurchaseOrderLineInputSchema>;
export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
