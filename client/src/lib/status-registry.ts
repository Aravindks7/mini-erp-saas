import {
  type StatusTone,
  type StatusMap,
  type StatusConfig,
} from '@/components/shared/StatusBadge';
import { invoiceStatusMap } from '@/features/invoices/constants/status';
import { salesOrderStatusMap } from '@/features/sales-orders/constants/status';
import { billStatusMap } from '@/features/bills/constants/status';
import { purchaseOrderStatusMap } from '@/features/purchase-orders/constants/status';
import { customerStatusMap } from '@/features/customers/constants/status';
import { supplierStatusMap } from '@/features/suppliers/constants/status';
import { transferStatusMap, adjustmentStatusMap } from '@/features/inventory/constants/status';
import { shipmentStatusMap } from '@/features/shipments/constants/status';
import { paymentStatusMap, paymentTypeMap } from '@/features/payments/constants/status';
import { accountStatusMap } from '@/features/accounts/constants/status';
import { inviteStatusMap } from '@/features/invitations/constants/status';
import { journalStatusMap } from '@/features/journal-entries/constants/status';
import { receiptStatusMap } from '@/features/receipts/constants/status';
import { productStatusMap } from '@/features/products/constants/status';
import { currencyStatusMap } from '@/features/currencies/constants/status';
import { memberRoleStatusMap } from '@/features/members/constants/status';
import { intentStatusMap } from '@/features/payments/constants/status';
import { referenceTypeStatusMap } from '@/features/inventory/constants/status';

// Re-export utils for convenience
export * from './status-utils';
export type { StatusTone, StatusMap, StatusConfig };

/**
 * Global Status Registry.
 * Axiom: Centralizes status metadata across all domain modules.
 */
export const GLOBAL_STATUS_REGISTRY = {
  invoice: invoiceStatusMap,
  sales_order: salesOrderStatusMap,
  bill: billStatusMap,
  purchase_order: purchaseOrderStatusMap,
  customer: customerStatusMap,
  supplier: supplierStatusMap,
  inventory_transfer: transferStatusMap,
  inventory_adjustment: adjustmentStatusMap,
  shipment: shipmentStatusMap,
  payment: paymentStatusMap,
  payment_type: paymentTypeMap,
  account: accountStatusMap,
  invitation: inviteStatusMap,
  journal_entry: journalStatusMap,
  receipt: receiptStatusMap,
  product: productStatusMap,
  currency: currencyStatusMap,
  member_role: memberRoleStatusMap,
  payment_intent: intentStatusMap,
  inventory_reference: referenceTypeStatusMap,
} as const;

export type EntityType = keyof typeof GLOBAL_STATUS_REGISTRY;

/**
 * Resolves a status config from the global registry.
 */
export function resolveStatusConfig<T extends EntityType>(
  entityType: T,
  value: string,
): StatusConfig {
  const map = GLOBAL_STATUS_REGISTRY[entityType] as StatusMap<string>;
  return map[value] || { label: value, tone: 'neutral' as StatusTone };
}

/**
 * Resolves options for select/filter inputs from the registry.
 */
export function getStatusOptions<T extends EntityType>(entityType: T) {
  const map = GLOBAL_STATUS_REGISTRY[entityType] as StatusMap<string>;
  return Object.entries(map).map(([value, config]) => ({
    label: (config as StatusConfig).label,
    value,
  }));
}
