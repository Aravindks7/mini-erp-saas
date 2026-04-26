import { z } from 'zod';

export const createTaxSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  rate: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Rate must be a non-negative number',
  }),
  description: z.string().max(255).optional().nullable(),
});

export const updateTaxSchema = createTaxSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const bulkDeleteTaxesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one Tax ID is required'),
});

export type CreateTaxInput = z.infer<typeof createTaxSchema>;
export type UpdateTaxInput = z.infer<typeof updateTaxSchema>;
export type BulkDeleteTaxesInput = z.infer<typeof bulkDeleteTaxesSchema>;
