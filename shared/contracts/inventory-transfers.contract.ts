import { z } from 'zod';

export const inventoryTransferLineSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
});

export const createInventoryTransferSchema = z.object({
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  reference: z.string().optional().nullable(),
  lines: z.array(inventoryTransferLineSchema).min(1),
});

export const updateTransferStatusSchema = z.object({
  status: z.enum(['shipped', 'received', 'cancelled']),
});

export type InventoryTransferLineInput = z.infer<typeof inventoryTransferLineSchema>;
export type CreateInventoryTransferInput = z.infer<typeof createInventoryTransferSchema>;
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>;
