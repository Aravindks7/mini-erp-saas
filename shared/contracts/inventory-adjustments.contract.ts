import { z } from 'zod';

export const inventoryAdjustmentLineSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  binId: z.string().uuid().optional().nullable(),
  quantityVariance: z.coerce.number(), // Can be negative (shrinkage)
});

export const createInventoryAdjustmentSchema = z.object({
  adjustmentDate: z.string().datetime().optional().nullable(),
  reason: z.string().min(1),
  reference: z.string().optional().nullable(),
  lines: z.array(inventoryAdjustmentLineSchema).min(1),
});

export const updateAdjustmentStatusSchema = z.object({
  status: z.enum(['approved', 'cancelled']),
});

export type InventoryAdjustmentLineInput = z.infer<typeof inventoryAdjustmentLineSchema>;
export type CreateInventoryAdjustmentInput = z.infer<typeof createInventoryAdjustmentSchema>;
export type UpdateAdjustmentStatusInput = z.infer<typeof updateAdjustmentStatusSchema>;
