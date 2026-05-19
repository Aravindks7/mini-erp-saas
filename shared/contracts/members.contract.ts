import { z } from 'zod';

export const updateMemberRoleSchema = z.object({
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

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type MemberResponse = z.infer<typeof memberResponseSchema>;
