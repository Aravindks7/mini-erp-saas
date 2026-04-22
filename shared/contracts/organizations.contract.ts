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

export const updateMemberRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const inviteMemberSchema = z.object({
  userEmail: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  roleId: z.string().uuid(),
});

export const memberResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  roleId: z.string().uuid(),
  roleName: z.string(),
  joinedAt: z.string().datetime(),
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    image: z.string().url().nullable(),
  }),
});

export const inviteResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  roleId: z.string().uuid(),
  roleName: z.string(),
  status: z.enum(['pending', 'accepted', 'revoked']),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
