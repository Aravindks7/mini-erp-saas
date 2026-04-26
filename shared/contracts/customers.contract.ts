import { z } from 'zod';
import { addressSchema, contactSchema } from './common.contract.js';

export const customerStatusEnumSchema = z.enum(['active', 'inactive']);

export const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  taxNumber: z.string().max(50).optional().nullable(),
  status: customerStatusEnumSchema.default('active'),
  addresses: z.array(addressSchema).optional(),
  contacts: z.array(contactSchema).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().uuid().optional(), // id is usually in the URL but good to have here too
});

export const bulkDeleteCustomersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one customer ID is required'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type BulkDeleteCustomersInput = z.infer<typeof bulkDeleteCustomersSchema>;
