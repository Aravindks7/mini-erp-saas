import { z } from 'zod';

export const createUomSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(255).optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const updateUomSchema = createUomSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const bulkDeleteUomSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one UoM ID is required'),
});

export type CreateUomInput = z.infer<typeof createUomSchema>;
export type UpdateUomInput = z.infer<typeof updateUomSchema>;
export type BulkDeleteUomInput = z.infer<typeof bulkDeleteUomSchema>;
