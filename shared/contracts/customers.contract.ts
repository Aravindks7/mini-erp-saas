import { z } from 'zod';

export const customerStatusEnumSchema = z.enum(['active', 'inactive']);

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional().nullable(),
  companyName: z.string().min(1, 'Company name is required').max(200).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  status: customerStatusEnumSchema.default('active'),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
