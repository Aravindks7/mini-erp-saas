import { z } from 'zod';
import { addressSchema } from './common.contract.js';

export const binSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1, 'Bin code is required').max(50),
  name: z.string().max(100).optional().nullable(),
});

export const createWarehouseSchema = z.object({
  code: z.string().min(1, 'Warehouse code is required').max(50),
  name: z.string().min(1, 'Warehouse name is required').max(200),
  addresses: z.array(addressSchema).optional(),
  bins: z.array(binSchema).optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const bulkDeleteWarehousesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one warehouse ID is required'),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type BulkDeleteWarehousesInput = z.infer<typeof bulkDeleteWarehousesSchema>;
