import { z } from 'zod';

export const roleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  organizationId: z.string().uuid().nullable(),
  isBaseRole: z.boolean(),
  permissionSetIds: z.array(z.string().uuid()),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissionSetIds: z.array(z.string().uuid()).min(1, 'At least one permission set is required'),
});

export const updateRoleSchema = createRoleSchema.partial();

export type RoleResponse = z.infer<typeof roleResponseSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
