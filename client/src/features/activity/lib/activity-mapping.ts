import {
  ShoppingCart,
  Package,
  FileText,
  Receipt,
  Users,
  Truck,
  Boxes,
  Layers,
  CreditCard,
  Settings,
  Shield,
  Activity,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Info,
  DollarSign,
  Ban,
  ArrowRightLeft,
  Briefcase,
  History,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityAction } from '@shared/config/activity-actions.config';
import { APP_PATHS } from '@/lib/paths';
import { GLOBAL_STATUS_REGISTRY } from '@/lib/status-registry';
import type { StatusMap } from '@/lib/status-registry';

/**
 * Technical Taxonomy: Activity Logging Visual System
 * 1. Action Groups: Semantic grouping of actions for color coding.
 * 2. ACTION_TO_GROUP: Mapping of specific actions to their semantic group.
 * 3. ENTITY_CONFIG: Visual styling for different entity types.
 * 4. ENTITY_PATH_MAP: Route mapping for activity links.
 */

type ActionGroup =
  | 'CREATION'
  | 'SUCCESS'
  | 'WARNING'
  | 'INFO'
  | 'FINANCE'
  | 'DANGER'
  | 'LOGISTICS'
  | 'GENERAL'
  | 'UPDATE';

interface ActionDisplayConfig {
  label: string;
  color: string;
  icon: LucideIcon;
}

interface EntityDisplayConfig {
  color: string;
  icon: LucideIcon;
}

// Inferred from activity logs - shared with backend
type EntityType =
  | 'sales_order'
  | 'purchase_order'
  | 'invoice'
  | 'bill'
  | 'customer'
  | 'supplier'
  | 'product'
  | 'product_category'
  | 'payment'
  | 'payment_intent'
  | 'user'
  | 'role'
  | 'permission_set'
  | 'organization'
  | 'tax'
  | 'uom'
  | 'warehouse'
  | 'inventory_level'
  | 'inventory_adjustment'
  | 'inventory_transfer'
  | 'inventory_allocation'
  | 'receipt'
  | 'shipment'
  | 'account'
  | 'journal_entry'
  | 'sequence'
  | 'auth'
  | 'currency';

const ACTION_GROUPS: Record<ActionGroup, ActionDisplayConfig> = {
  CREATION: {
    label: 'Created',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    icon: PlusCircle,
  },
  UPDATE: {
    label: 'Updated',
    color: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    icon: History,
  },
  SUCCESS: {
    label: 'Success',
    color: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20',
    icon: CheckCircle2,
  },
  WARNING: {
    label: 'Warning',
    color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    icon: AlertCircle,
  },
  INFO: {
    label: 'Information',
    color: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    icon: Info,
  },
  FINANCE: {
    label: 'Financial',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
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
  GENERAL: {
    label: 'General',
    color: 'text-slate-500 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20',
    icon: Activity,
  },
};

/**
 * Exhaustive mapping of ActivityAction to Semantic Intent.
 * Matches types in @shared/config/activity-actions.config
 */
const ACTION_TO_GROUP: Record<ActivityAction, ActionGroup> = {
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
  PAYMENT_CREATED: 'FINANCE',
  TAX_CONFIG_CREATED: 'CREATION',

  // Success & Completion
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
  PAYMENT_RECEIVED: 'SUCCESS',
  PAYMENT_REALIZED: 'SUCCESS',
  PAYMENT_SENT: 'SUCCESS',

  // Updates & Modifications
  UPDATED: 'UPDATE',
  STATUS_CHANGED: 'UPDATE',
  MEMBER_ROLE_CHANGED: 'UPDATE',
  PERMISSION_SET_UPDATED: 'UPDATE',
  SEQUENCE_INITIALIZED: 'UPDATE',
  DOCUMENT_RENAMED: 'UPDATE',
  ROLE_UPDATED: 'UPDATE',

  // Danger & Destructive
  DELETED: 'DANGER',
  VOIDED: 'DANGER',
  ORDER_CANCELLED: 'DANGER',
  PO_CANCELLED: 'DANGER',
  PAYMENT_FAILED: 'DANGER',
  PAYMENT_REFUNDED: 'DANGER',
  INVITE_REVOKED: 'DANGER',
  MEMBER_REMOVED: 'DANGER',
  PERMISSION_SET_DELETED: 'DANGER',
  ROLE_DELETED: 'DANGER',

  // Logistics & Special
  SYSTEM_RECONCILIATION: 'LOGISTICS',
  BILL_CREATED: 'FINANCE',
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
      'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: CreditCard,
  },
  user: {
    color:
      'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    icon: Users,
  },
  role: {
    color:
      'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20',
    icon: Shield,
  },
  permission_set: {
    color:
      'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20',
    icon: Lock,
  },
  tax: {
    color:
      'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: DollarSign,
  },
  uom: {
    color:
      'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: Settings,
  },
  warehouse: {
    color:
      'text-stone-600 bg-stone-50 border-stone-200 dark:text-stone-400 dark:bg-stone-500/10 dark:border-stone-500/20 hover:bg-stone-100 dark:hover:bg-stone-500/20',
    icon: Briefcase,
  },
  inventory_adjustment: {
    color:
      'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20',
    icon: ArrowRightLeft,
  },
  inventory_transfer: {
    color:
      'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    icon: Truck,
  },
  receipt: {
    color:
      'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-500/10 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20',
    icon: Receipt,
  },
  journal_entry: {
    color:
      'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: FileText,
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
      label: toTitleCase(action),
    };
  }

  return {
    label: toTitleCase(action),
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

export function getStatusMap(entityType: string): StatusMap<string> | undefined {
  return (GLOBAL_STATUS_REGISTRY as Partial<Record<string, StatusMap<string>>>)[entityType];
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
