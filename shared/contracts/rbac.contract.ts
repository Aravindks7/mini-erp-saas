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
    RECEIVE: 'inventory:receive',
    TRANSFER: 'inventory:transfer',
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
  PRODUCT_CATEGORIES: {
    READ: 'product-categories:read',
    CREATE: 'product-categories:create',
    UPDATE: 'product-categories:update',
    DELETE: 'product-categories:delete',
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
  RECEIPTS: {
    READ: 'receipts:read',
    CREATE: 'receipts:create',
    DELETE: 'receipts:delete',
  },
  SHIPMENTS: {
    READ: 'shipments:read',
    CREATE: 'shipments:create',
    DELETE: 'shipments:delete',
  },
  INVOICES: {
    READ: 'invoices:read',
    CREATE: 'invoices:create',
    UPDATE: 'invoices:update',
    DELETE: 'invoices:delete',
  },
  BILLS: {
    READ: 'bills:read',
    CREATE: 'bills:create',
    UPDATE: 'bills:update',
    DELETE: 'bills:delete',
  },
  PAYMENTS: {
    READ: 'payments:read',
    CREATE: 'payments:create',
    UPDATE: 'payments:update',
    DELETE: 'payments:delete',
  },
  DASHBOARD: {
    READ: 'dashboard:read',
  },
  FINANCE: {
    READ: 'finance:read',
    CREATE: 'finance:create',
    UPDATE: 'finance:update',
    DELETE: 'finance:delete',
  },
  CURRENCIES: {
    READ: 'currencies:read',
    CREATE: 'currencies:create',
    UPDATE: 'currencies:update',
    DELETE: 'currencies:delete',
  },
} as const;

// Helper to extract all values from the nested object
type ValuesOf<T> = T extends object ? ValuesOf<T[keyof T]> : T;
export type Permission = ValuesOf<typeof PERMISSIONS>;

export const permissionSchema = z.string().refine((val): val is Permission => {
  const allPermissions = Object.values(PERMISSIONS).flatMap((group) => Object.values(group));
  return allPermissions.includes(val as Permission);
});

// --- RBAC Management Schemas (Moved to dedicated files) ---
