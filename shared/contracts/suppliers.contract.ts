import { z } from 'zod';
import { addressSchema, contactSchema } from './common.contract.js';

export const supplierStatusEnumSchema = z.enum(['active', 'inactive']);

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(200),
  taxNumber: z.string().max(50).optional().nullable(),
  status: supplierStatusEnumSchema.default('active'),
  addresses: z.array(addressSchema).optional(),
  contacts: z.array(contactSchema).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const bulkDeleteSuppliersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one supplier ID is required'),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
export type BulkDeleteSuppliersInput = z.infer<typeof bulkDeleteSuppliersSchema>;
