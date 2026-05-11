import {
  PlusCircle,
  CheckCircle2,
  RefreshCcw,
  DollarSign,
  Ban,
  Truck,
  Activity,
  ShoppingCart,
  Package,
  FileText,
  Receipt,
  Users,
  Boxes,
  Layers,
  CreditCard,
  User,
  ShieldCheck,
  Percent,
  Ruler,
  Warehouse,
  Archive,
  ClipboardCheck,
  Book,
  Hash,
  Coins,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityAction, EntityType } from '@shared/config/activity-actions.config';
import type { StatusMap } from '@/components/shared/StatusBadge';
import { APP_PATHS } from '@/lib/paths';

// Import feature status maps for rich status badge rendering
import { invoiceStatusMap } from '@/features/invoices/components/columns';
import { salesOrderStatusMap } from '@/features/sales-orders/components/columns';
import { purchaseOrderStatusMap } from '@/features/purchase-orders/components/columns';
import { billStatusMap } from '@/features/bills/components/columns';
import { transferStatusMap, adjustmentStatusMap } from '@/features/inventory/config';

export interface ActionDisplayConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

export interface EntityDisplayConfig {
  color: string;
  icon: LucideIcon;
}

/**
 * Semantic Intents for Activity Actions.
 * Groups exhaustive strings from @shared/config into visual categories.
 * Rule 7.1: Maintains premium UI consistency across 50+ actions.
 */
const ACTION_GROUPS: Record<string, ActionDisplayConfig> = {
  CREATION: {
    label: 'Created',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    icon: PlusCircle,
  },
  SUCCESS: {
    label: 'Approved',
    color: 'text-sky-500 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-500/20',
    icon: CheckCircle2,
  },
  UPDATE: {
    label: 'Updated',
    color: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20',
    icon: RefreshCcw,
  },
  FINANCE: {
    label: 'Financial',
    color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    icon: DollarSign,
  },
  DANGER: {
    label: 'Destructive',
    color: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
    icon: Ban,
  },
  LOGISTICS: {
    label: 'Logistics',
    color: 'text-slate-500 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20',
    icon: Truck,
  },
};

/**
 * Exhaustive mapping of ActivityAction to Semantic Intent.
 */
const ACTION_TO_GROUP: Record<ActivityAction, keyof typeof ACTION_GROUPS> = {
  // Creation & Onboarding
  CREATED: 'CREATION',
  USER_CREATED: 'CREATION',
  USER_JOINED_ORGANIZATION: 'CREATION',
  ROLE_CREATED: 'CREATION',
  MEMBER_ADDED: 'CREATION',
  INVITE_SENT: 'CREATION',
  INVITE_ACCEPTED: 'CREATION',
  PERMISSION_SET_CREATED: 'CREATION',
  ORDER_CREATED: 'CREATION',
  PO_CREATED: 'CREATION',
  INVOICE_CREATED: 'CREATION',
  UOM_CREATED: 'CREATION',
  CATEGORY_CREATED: 'CREATION',
  BIN_CREATED: 'CREATION',
  SHIPMENT_CREATED: 'CREATION',
  INVENTORY_TRANSFER_CREATED: 'CREATION',
  STRIPE_INTENT_CREATED: 'CREATION',

  // Approval & Fulfillment
  ORDER_APPROVED: 'SUCCESS',
  PO_APPROVED: 'SUCCESS',
  PO_RECEIVED: 'SUCCESS',
  ORDER_INVOICED: 'SUCCESS',
  ORDER_SHIPPED: 'SUCCESS',
  STOCK_ADJUSTED: 'SUCCESS',
  GOODS_RECEIVED: 'SUCCESS',
  INVOICE_POSTED: 'SUCCESS',
  VENDOR_BILL_POSTED: 'SUCCESS',
  LEDGER_POSTED: 'SUCCESS',

  // Modifications & Maintenance
  UPDATED: 'UPDATE',
  STATUS_CHANGED: 'UPDATE',
  MEMBER_ROLE_CHANGED: 'UPDATE',
  PERMISSION_SET_UPDATED: 'UPDATE',
  DOCUMENT_RENAMED: 'UPDATE',
  SEQUENCE_INITIALIZED: 'UPDATE',

  // Finance & Ledger
  PAYMENT_RECEIVED: 'FINANCE',
  PAYMENT_CREATED: 'FINANCE',
  PAYMENT_REALIZED: 'FINANCE',
  PAYMENT_SENT: 'FINANCE',
  BILL_CREATED: 'FINANCE',

  // Risk & Destructive
  DELETED: 'DANGER',
  VOIDED: 'DANGER',
  ORDER_CANCELLED: 'DANGER',
  PO_CANCELLED: 'DANGER',
  PAYMENT_FAILED: 'DANGER',
  PAYMENT_REFUNDED: 'DANGER',
  INVITE_REVOKED: 'DANGER',
  MEMBER_REMOVED: 'DANGER',
  PERMISSION_SET_DELETED: 'DANGER',

  // Logistics & Ops
  SYSTEM_RECONCILIATION: 'LOGISTICS',
  TAX_CONFIG_CREATED: 'CREATION',
};

/**
 * Entity-specific visual configurations.
 */
const ENTITY_CONFIG: Partial<Record<EntityType, EntityDisplayConfig>> = {
  sales_order: {
    color:
      'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    icon: ShoppingCart,
  },
  purchase_order: {
    color:
      'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20',
    icon: Package,
  },
  invoice: {
    color:
      'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    icon: FileText,
  },
  bill: {
    color:
      'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: Receipt,
  },
  customer: {
    color:
      'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
    icon: Users,
  },
  supplier: {
    color:
      'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-500/10 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20',
    icon: Truck,
  },
  product: {
    color:
      'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20',
    icon: Boxes,
  },
  product_category: {
    color:
      'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: Layers,
  },
  payment: {
    color:
      'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20',
    icon: CreditCard,
  },
  payment_intent: {
    color:
      'text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20',
    icon: DollarSign,
  },
  currency: {
    color:
      'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
    icon: Coins,
  },
  user: {
    color:
      'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20',
    icon: User,
  },
  role: {
    color:
      'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20',
    icon: ShieldCheck,
  },
  tax: {
    color:
      'text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-500/10 dark:border-zinc-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-500/20',
    icon: Percent,
  },
  uom: {
    color:
      'text-neutral-600 bg-neutral-50 border-neutral-200 dark:text-neutral-400 dark:bg-neutral-500/10 dark:border-neutral-500/20 hover:bg-neutral-100 dark:hover:bg-neutral-500/20',
    icon: Ruler,
  },
  warehouse: {
    color:
      'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/20',
    icon: Warehouse,
  },
  bin: {
    color:
      'text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20',
    icon: Archive,
  },
  inventory_adjustment: {
    color:
      'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20',
    icon: RefreshCcw,
  },
  inventory_transfer: {
    color:
      'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: RefreshCcw,
  },
  receipt: {
    color:
      'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20',
    icon: ClipboardCheck,
  },
  journal_entry: {
    color:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: Book,
  },
  sequence: {
    color:
      'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: Hash,
  },
};

/**
 * Mapping of EntityType to their primary route paths.
 */
const ENTITY_PATH_MAP: Partial<Record<EntityType, string>> = {
  sales_order: APP_PATHS.sales.orders.list(),
  purchase_order: APP_PATHS.purchasing.orders.list(),
  invoice: APP_PATHS.sales.invoices.list(),
  bill: APP_PATHS.purchasing.bills.list(),
  customer: APP_PATHS.sales.customers.list(),
  supplier: APP_PATHS.purchasing.suppliers.list(),
  product: APP_PATHS.inventory.products.list(),
  product_category: APP_PATHS.setup.productCategories.list(),
  currency: APP_PATHS.setup.currencies.list(),
  payment: APP_PATHS.finance.payments.list(),
  payment_intent: APP_PATHS.finance.payments.list(),
  user: APP_PATHS.settings.members(),
  role: APP_PATHS.settings.roles.list(),
  tax: APP_PATHS.setup.taxes.list(),
  uom: APP_PATHS.setup.uom.list(),
  warehouse: APP_PATHS.setup.warehouses.list(),
  inventory_adjustment: APP_PATHS.inventory.adjustments.list(),
  inventory_transfer: APP_PATHS.inventory.transfers.list(),
  receipt: APP_PATHS.purchasing.receipts.list(),
  journal_entry: APP_PATHS.finance.journalEntries.list(),
};

/**
 * Resolves the display configuration for a specific activity action.
 */
export function getActionDisplayConfig(action: string): ActionDisplayConfig {
  const groupKey = ACTION_TO_GROUP[action as ActivityAction];
  const group = groupKey ? ACTION_GROUPS[groupKey] : null;

  if (group) {
    return {
      ...group,
      label: action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    };
  }

  return {
    label: action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    color: 'text-muted-foreground bg-muted',
    icon: Activity,
  };
}

/**
 * Resolves the visual configuration for a specific entity type.
 */
export function getEntityDisplayConfig(entityType: string): EntityDisplayConfig {
  return (
    ENTITY_CONFIG[entityType as EntityType] || {
      color: 'text-muted-foreground bg-muted/40 border-border',
      icon: Activity,
    }
  );
}

/**
 * Resolves the primary route path for a specific entity type.
 */
export function getEntityPath(entityType: string): string | null {
  return ENTITY_PATH_MAP[entityType as EntityType] || null;
}

/**
 * Resolves the appropriate status map for a given entity type.
 */
export function getStatusMap(entityType: string): StatusMap<string> | undefined {
  switch (entityType) {
    case 'invoice':
      return invoiceStatusMap;
    case 'sales_order':
      return salesOrderStatusMap;
    case 'purchase_order':
      return purchaseOrderStatusMap;
    case 'bill':
      return billStatusMap;
    case 'inventory_transfer':
      return transferStatusMap;
    case 'inventory_adjustment':
      return adjustmentStatusMap;
    default:
      return undefined;
  }
}
