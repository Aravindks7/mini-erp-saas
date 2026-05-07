/**
 * Application Route Dictionary
 * Single source of truth for all URL paths in the application.
 * Facilitates easy refactoring and type-safe navigation.
 */
export const APP_PATHS = {
  dashboard: () => '/',
  auth: {
    login: () => '/login',
    register: () => '/register',
    onboarding: () => '/onboarding',
    selectOrganization: () => '/select-organization',
  },
  system: {
    index: () => '/system',
    activity: () => '/activity',
    settings: () => '/settings',
  },
  sales: {
    index: () => '/sales',
    customers: {
      list: () => '/sales/customers',
      new: () => '/sales/customers/new',
      detail: (id: string) => `/sales/customers/${id}`,
      edit: (id: string) => `/sales/customers/${id}/edit`,
    },
    orders: {
      list: () => '/sales/orders',
      new: () => '/sales/orders/new',
      detail: (id: string) => `/sales/orders/${id}`,
      edit: (id: string) => `/sales/orders/${id}/edit`,
    },
    invoices: {
      list: () => '/sales/invoices',
      new: () => '/sales/invoices/new',
      detail: (id: string) => `/sales/invoices/${id}`,
      edit: (id: string) => `/sales/invoices/${id}/edit`,
    },
    shipments: {
      list: () => '/sales/shipments',
      new: () => '/sales/shipments/new',
      detail: (id: string) => `/sales/shipments/${id}`,
      edit: (id: string) => `/sales/shipments/${id}/edit`,
    },
  },
  purchasing: {
    index: () => '/purchasing',
    suppliers: {
      list: () => '/purchasing/suppliers',
      new: () => '/purchasing/suppliers/new',
      detail: (id: string) => `/purchasing/suppliers/${id}`,
      edit: (id: string) => `/purchasing/suppliers/${id}/edit`,
    },
    orders: {
      list: () => '/purchasing/orders',
      new: () => '/purchasing/orders/new',
      detail: (id: string) => `/purchasing/orders/${id}`,
      edit: (id: string) => `/purchasing/orders/${id}/edit`,
    },
    receipts: {
      list: () => '/purchasing/receipts',
      new: () => '/purchasing/receipts/new',
      detail: (id: string) => `/purchasing/receipts/${id}`,
      edit: (id: string) => `/purchasing/receipts/${id}/edit`,
    },
    bills: {
      list: () => '/purchasing/bills',
      new: () => '/purchasing/bills/new',
      detail: (id: string) => `/purchasing/bills/${id}`,
      edit: (id: string) => `/purchasing/bills/${id}/edit`,
    },
  },
  inventory: {
    index: () => '/inventory',
    levels: {
      list: () => '/inventory/levels',
      detail: (id: string) => `/inventory/levels/${id}`,
    },
    ledger: () => '/inventory/ledger',
    adjustments: {
      list: () => '/inventory/adjustments',
      new: () => '/inventory/adjustments/new',
      detail: (id: string) => `/inventory/adjustments/${id}`,
    },
    transfers: {
      list: () => '/inventory/transfers',
      new: () => '/inventory/transfers/new',
      detail: (id: string) => `/inventory/transfers/${id}`,
    },
    products: {
      list: () => '/inventory/products',
      new: () => '/inventory/products/new',
      detail: (id: string) => `/inventory/products/${id}`,
      edit: (id: string) => `/inventory/products/${id}/edit`,
    },
  },
  finance: {
    index: () => '/finance',
    accounts: {
      list: () => '/finance/accounts',
      new: () => '/finance/accounts/new',
      detail: (id: string) => `/finance/accounts/${id}`,
    },
    journalEntries: {
      list: () => '/finance/journal-entries',
      new: () => '/finance/journal-entries/new',
      detail: (id: string) => `/finance/journal-entries/${id}`,
      edit: (id: string) => `/finance/journal-entries/${id}/edit`,
    },
    payments: {
      list: () => '/finance/payments',
      new: () => '/finance/payments/new',
      detail: (id: string) => `/finance/payments/${id}`,
      edit: (id: string) => `/finance/payments/${id}/edit`,
    },
    reports: {
      pnl: () => '/finance/reports/pnl',
      balanceSheet: () => '/finance/reports/balance-sheet',
    },
  },
  setup: {
    index: () => '/setup',
    productCategories: {
      list: () => '/setup/product-categories',
    },
    uom: {
      list: () => '/setup/uom',
      detail: (id: string) => `/setup/uom/${id}`,
    },
    taxes: {
      list: () => '/setup/taxes',
      detail: (id: string) => `/setup/taxes/${id}`,
    },
    warehouses: {
      list: () => '/setup/warehouses',
      new: () => '/setup/warehouses/new',
      detail: (id: string) => `/setup/warehouses/${id}`,
      edit: (id: string) => `/setup/warehouses/${id}/edit`,
    },
  },
  settings: {
    index: () => '/settings',
    profile: () => '/settings/profile',
    sequences: () => '/settings/sequences',
    members: () => '/settings/members',
    invites: () => '/settings/invites',
    roles: {
      list: () => '/settings/roles',
      new: () => '/settings/roles/new',
      detail: (id: string) => `/settings/roles/${id}`,
    },
    permissionSets: {
      list: () => '/settings/permission-sets',
      new: () => '/settings/permission-sets/new',
      detail: (id: string) => `/settings/permission-sets/${id}`,
    },
  },
} as const;
