import { z } from 'zod';

export const salesOrderLineInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.string().min(1, 'Quantity is required'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  taxRateAtOrder: z.string().min(1, 'Tax rate is required'),
  taxAmount: z.string().min(1, 'Tax amount is required'),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  lines: z.array(salesOrderLineInputSchema).min(1, 'At least one line is required'),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;

export const fulfillSalesOrderLineSchema = z.object({
  salesOrderLineId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  binId: z.string().uuid().optional(),
  quantityShipped: z.string().min(1, 'Quantity shipped is required'),
});

export const fulfillSalesOrderSchema = z.object({
  lines: z.array(fulfillSalesOrderLineSchema).min(1, 'At least one line is required to fulfill'),
});

export type FulfillSalesOrderInput = z.infer<typeof fulfillSalesOrderSchema>;
