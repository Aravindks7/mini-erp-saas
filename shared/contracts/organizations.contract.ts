import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  defaultCountry: z
    .string({ message: 'Please select a default country' })
    .trim()
    .min(1, 'Please select a default country'),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// --- Membership & Invitation Schemas (Moved to dedicated files) ---
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
