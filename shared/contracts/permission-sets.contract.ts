import { z } from 'zod';

export const permissionSetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  organizationId: z.string().uuid().nullable(),
  isBaseSet: z.boolean(),
  permissions: z.array(z.string()),
});

export const createPermissionSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

export const updatePermissionSetSchema = createPermissionSetSchema.partial();

export type PermissionSetResponse = z.infer<typeof permissionSetResponseSchema>;
export type CreatePermissionSetInput = z.infer<typeof createPermissionSetSchema>;
export type UpdatePermissionSetInput = z.infer<typeof updatePermissionSetSchema>;
