export const ACTIVITY_ACTIONS = [
  // Generic
  'CREATED',
  'UPDATED',
  'DELETED',
  'STATUS_CHANGED',

  // Security & Identity
  'USER_CREATED',
  'USER_JOINED_ORGANIZATION',
  'ROLE_CREATED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'MEMBER_ROLE_CHANGED',
  'INVITE_SENT',
  'INVITE_REVOKED',
  'INVITE_ACCEPTED',
  'PERMISSION_SET_CREATED',
  'PERMISSION_SET_UPDATED',
  'PERMISSION_SET_DELETED',

  // Configuration
  'TAX_CONFIG_CREATED',
  'UOM_CREATED',
  'CATEGORY_CREATED',
  'BIN_CREATED',
  'SEQUENCE_INITIALIZED',

  // Sales Orders
  'ORDER_CREATED',
  'ORDER_APPROVED',
  'ORDER_SHIPPED',
  'ORDER_INVOICED',
  'ORDER_CANCELLED',

  // Purchase Orders
  'PO_CREATED',
  'PO_APPROVED',
  'PO_RECEIVED',
  'PO_CANCELLED',

  // Inventory
  'STOCK_ADJUSTED',
  'GOODS_RECEIVED',
  'SHIPMENT_CREATED',
  'INVENTORY_TRANSFER_CREATED',

  // Invoices & Bills
  'INVOICE_POSTED',
  'BILL_CREATED',
  'INVOICE_CREATED',
  'PAYMENT_CREATED',
  'PAYMENT_REALIZED',
  'PAYMENT_FAILED',
  'PAYMENT_REFUNDED',
  'PAYMENT_RECEIVED',
  'PAYMENT_SENT',
  'VOIDED',
  'VENDOR_BILL_POSTED',

  // Finance
  'LEDGER_POSTED',
  'STRIPE_INTENT_CREATED',

  // System
  'SYSTEM_RECONCILIATION',
  'DOCUMENT_RENAMED',
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ENTITY_TYPES = [
  'sales_order',
  'purchase_order',
  'invoice',
  'bill',
  'customer',
  'supplier',
  'product',
  'inventory_adjustment',
  'inventory_transfer',
  'payment',
  'sequence',
  'user',
  'role',
  'tax',
  'uom',
  'product_category',
  'warehouse',
  'bin',
  'receipt',
  'shipment',
  'journal_entry',
  'payment_intent',
  'currency',
  'account',
  'organization',
  'permission_set',
  'membership',
  'invite',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ACTION_REASONS: Partial<Record<ActivityAction, { value: string; label: string }[]>> = {
  ORDER_APPROVED: [
    { value: 'standard_approval', label: 'Standard Approval' },
    { value: 'expedited_request', label: 'Expedited Request' },
    { value: 'manager_override', label: 'Manager Override' },
  ],
  ORDER_CANCELLED: [
    { value: 'customer_request', label: 'Customer Request' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'payment_failed', label: 'Payment Failed' },
  ],
  SYSTEM_RECONCILIATION: [
    { value: 'auto_fulfillment', label: 'System reconciliation of fulfillment' },
    { value: 'auto_billing', label: 'System reconciliation of billing' },
  ],
  ORDER_SHIPPED: [
    { value: 'standard_fulfillment', label: 'Standard Fulfillment' },
    { value: 'partial_fulfillment', label: 'Partial Fulfillment' },
    { value: 'backorder_shipped', label: 'Backorder Shipped' },
    { value: 'expedited_shipping', label: 'Expedited Shipping' },
  ],
  ORDER_INVOICED: [
    { value: 'full_invoice', label: 'Full Invoice Generated' },
    { value: 'partial_invoice', label: 'Partial Invoice Generated' },
    { value: 'deposit_invoice', label: 'Deposit/Down Payment' },
  ],
};
