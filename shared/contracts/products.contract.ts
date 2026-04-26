import { z } from 'zod';

export const productStatusEnumSchema = z.enum(['active', 'inactive']);

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().nullable(),
  basePrice: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Base price must be a valid number')
    .default('0'),
  baseUomId: z.string().uuid('Invalid Base UoM ID'),
  taxId: z.string().uuid('Invalid Tax ID').optional().nullable(),
  status: productStatusEnumSchema.default('active'),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const bulkDeleteProductsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkDeleteProductsInput = z.infer<typeof bulkDeleteProductsSchema>;
