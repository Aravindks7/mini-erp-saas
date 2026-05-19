import { z } from 'zod';

export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Alphanumeric, underscores, and hyphens only'),
  description: z.string().max(500).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
