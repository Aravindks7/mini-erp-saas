import { z } from 'zod';

export const PERMISSIONS = {
  CUSTOMERS: {
    READ: 'customers:read',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    DELETE: 'customers:delete',
  },
  INVENTORY: {
    READ: 'inventory:read',
    ADJUST: 'inventory:adjust',
  },
  UOM: {
    READ: 'uom:read',
    CREATE: 'uom:create',
    UPDATE: 'uom:update',
    DELETE: 'uom:delete',
  },
  ORGANIZATION: {
    SETTINGS: 'org:settings:manage',
    MEMBERS: 'org:members:manage',
    ROLES: 'org:roles:manage',
  },
  TAXES: {
    READ: 'taxes:read',
    CREATE: 'taxes:create',
    UPDATE: 'taxes:update',
    DELETE: 'taxes:delete',
  },
  SUPPLIERS: {
    READ: 'suppliers:read',
    CREATE: 'suppliers:create',
    UPDATE: 'suppliers:update',
    DELETE: 'suppliers:delete',
  },
  PRODUCTS: {
    READ: 'products:read',
    CREATE: 'products:create',
    UPDATE: 'products:update',
    DELETE: 'products:delete',
  },
  WAREHOUSES: {
    READ: 'warehouses:read',
    CREATE: 'warehouses:create',
    UPDATE: 'warehouses:update',
    DELETE: 'warehouses:delete',
  },
  SALES_ORDERS: {
    READ: 'sales-orders:read',
    CREATE: 'sales-orders:create',
    UPDATE: 'sales-orders:update',
    DELETE: 'sales-orders:delete',
  },
  PURCHASE_ORDERS: {
    READ: 'purchase-orders:read',
    CREATE: 'purchase-orders:create',
    UPDATE: 'purchase-orders:update',
    DELETE: 'purchase-orders:delete',
  },
} as const;

// Helper to extract all values from the nested object
type ValuesOf<T> = T extends object ? ValuesOf<T[keyof T]> : T;
export type Permission = ValuesOf<typeof PERMISSIONS>;

export const permissionSchema = z.string().refine((val): val is Permission => {
  const allPermissions = Object.values(PERMISSIONS).flatMap((group) => Object.values(group));
  return allPermissions.includes(val as Permission);
});

// --- RBAC Management Schemas ---

export const permissionSetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  organizationId: z.string().uuid().nullable(),
  permissions: z.array(z.string()),
});

export const createPermissionSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
});

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

export type PermissionSetResponse = z.infer<typeof permissionSetResponseSchema>;
export type CreatePermissionSetInput = z.infer<typeof createPermissionSetSchema>;
export type RoleResponse = z.infer<typeof roleResponseSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updatePermissionSetSchema = createPermissionSetSchema.partial();
export const updateRoleSchema = createRoleSchema.partial();

export type UpdatePermissionSetInput = z.infer<typeof updatePermissionSetSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
