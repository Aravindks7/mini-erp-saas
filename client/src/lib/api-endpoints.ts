/**
 * API Endpoints Dictionary
 * Single source of truth for all backend communication paths.
 * Mirrors the APP_PATHS structure for architectural consistency.
 */
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    session: '/auth/session',
  },
  organizations: {
    base: '/organizations',
    detail: (id: string) => `/organizations/${id}`,
    members: (orgId: string) => `/organizations/${orgId}/members`,
    memberDetail: (orgId: string, userId: string) => `/organizations/${orgId}/members/${userId}`,
    invites: (orgId: string) => `/organizations/${orgId}/invites`,
    inviteDetail: (orgId: string, inviteId: string) =>
      `/organizations/${orgId}/invites/${inviteId}`,
    resendInvite: (orgId: string, inviteId: string) =>
      `/organizations/${orgId}/invites/${inviteId}/resend`,
  },
  customers: {
    base: '/customers',
    detail: (id: string) => `/customers/${id}`,
    import: '/customers/import',
    importTemplate: '/customers/import/template',
    export: '/customers/export',
    bulkDelete: '/customers',
  },
  suppliers: {
    base: '/suppliers',
    detail: (id: string) => `/suppliers/${id}`,
    import: '/suppliers/import',
    importTemplate: '/suppliers/import/template',
    export: '/suppliers/export',
    bulkDelete: '/suppliers',
  },
  products: {
    base: '/products',
    detail: (id: string) => `/products/${id}`,
    import: '/products/import',
    importTemplate: '/products/import/template',
    export: '/products/export',
    bulkDelete: '/products/bulk',
  },
  inventory: {
    levels: {
      base: '/inventory/levels',
      detail: (id: string) => `/inventory/levels/${id}`,
      ledger: (id: string) => `/inventory/levels/${id}/ledger`,
    },
    ledger: '/inventory/ledger',
    adjustments: {
      base: '/inventory/adjustments',
      detail: (id: string) => `/inventory/adjustments/${id}`,
      status: (id: string) => `/inventory/adjustments/${id}/status`,
    },
    transfers: {
      base: '/inventory/transfers',
      detail: (id: string) => `/inventory/transfers/${id}`,
      status: (id: string) => `/inventory/transfers/${id}/status`,
    },
  },
  dashboard: {
    base: '/dashboard',
    refresh: '/dashboard/refresh',
  },
  sales: {
    orders: {
      base: '/sales-orders',
      detail: (id: string) => `/sales-orders/${id}`,
      status: (id: string) => `/sales-orders/${id}/status`,
      bulkDelete: '/sales-orders',
    },
    invoices: {
      base: '/invoices',
      detail: (id: string) => `/invoices/${id}`,
      fromOrder: (soId: string) => `/invoices/from-so/${soId}`,
      status: (id: string) => `/invoices/${id}/status`,
      bulkDelete: '/invoices',
    },
    shipments: {
      base: '/shipments',
      detail: (id: string) => `/shipments/${id}`,
      bulkDelete: '/shipments',
    },
  },
  purchasing: {
    orders: {
      base: '/purchase-orders',
      detail: (id: string) => `/purchase-orders/${id}`,
      bulkDelete: '/purchase-orders',
    },
    receipts: {
      base: '/receipts',
      detail: (id: string) => `/receipts/${id}`,
      bulkDelete: '/receipts',
    },
    bills: {
      base: '/bills',
      detail: (id: string) => `/bills/${id}`,
      status: (id: string) => `/bills/${id}/status`,
      import: '/bills/import',
      importTemplate: '/bills/import/template',
      export: '/bills/export',
      bulkDelete: '/bills',
    },
  },
  finance: {
    accounts: {
      base: '/finance/accounts',
      detail: (id: string) => `/finance/accounts/${id}`,
    },
    journalEntries: {
      base: '/finance/journal-entries',
      detail: (id: string) => `/finance/journal-entries/${id}`,
      void: (id: string) => `/finance/journal-entries/${id}/void`,
    },
    payments: {
      base: '/payments',
      detail: (id: string) => `/payments/${id}`,
      intents: '/payments/intents',
      createStripeSession: '/payments/create-stripe-session',
      bulkDelete: '/payments',
    },
    reports: {
      pnl: '/finance/reports/profit-and-loss',
      balanceSheet: '/finance/reports/balance-sheet',
    },
  },
  settings: {
    sequences: {
      base: '/sequences',
      detail: (id: string) => `/sequences/${id}`,
    },
  },
  setup: {
    warehouses: {
      base: '/warehouses',
      detail: (id: string) => `/warehouses/${id}`,
      import: '/warehouses/import',
      importTemplate: '/warehouses/import/template',
      export: '/warehouses/export',
      bulkDelete: '/warehouses/bulk-delete',
    },
    uom: {
      base: '/uom',
      detail: (id: string) => `/uom/${id}`,
      bulkDelete: '/uom',
    },
    taxes: {
      base: '/taxes',
      detail: (id: string) => `/taxes/${id}`,
      bulkDelete: '/taxes',
    },
    productCategories: {
      base: '/product-categories',
      detail: (id: string) => `/product-categories/${id}`,
    },
  },
  activityLogs: {
    base: '/activity-logs',
  },
  rbac: {
    permissions: '/rbac/permissions',
    allPermissions: '/rbac/all-permissions',
    roles: {
      base: '/rbac/roles',
      detail: (id: string) => `/rbac/roles/${id}`,
    },
    permissionSets: {
      base: '/rbac/sets',
      detail: (id: string) => `/rbac/sets/${id}`,
    },
  },
};
