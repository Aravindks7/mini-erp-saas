import { z } from 'zod';

/**
 * Inventory Adjustment Line Schema
 * Handles individual stock corrections per product/location.
 */
export const inventoryAdjustmentLineSchema = z.object({
  productId: z.string().uuid('Invalid Product ID'),
  warehouseId: z.string().uuid('Invalid Warehouse ID'),
  binId: z.string().uuid('Invalid Bin ID').optional().nullable(),
  quantityChange: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Quantity change must be a valid number'),
});

/**
 * Create Inventory Adjustment Schema
 * Header + Lines for atomic stock corrections.
 */
export const createAdjustmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(200),
  reference: z.string().max(100).optional().nullable(),
  lines: z.array(inventoryAdjustmentLineSchema).min(1, 'At least one line is required'),
});

export type InventoryAdjustmentLineInput = z.infer<typeof inventoryAdjustmentLineSchema>;
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
