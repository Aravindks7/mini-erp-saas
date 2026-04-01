import { z } from 'zod';

export const customerStatusEnumSchema = z.enum(['active', 'inactive']);

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(100).optional().nullable(),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().min(1, 'Country is required').max(100),
  isPrimary: z.boolean().default(false),
  addressType: z.string().max(50).optional().nullable(),
});

export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().default(false),
});

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

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
