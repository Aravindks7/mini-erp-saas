import { z } from 'zod';

export const inviteMemberSchema = z.object({
  userEmail: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  roleId: z.string().uuid(),
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

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type InviteResponse = z.infer<typeof inviteResponseSchema>;
