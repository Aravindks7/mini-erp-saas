import { type StatusTone, type StatusMap } from '@/components/shared/StatusBadge';

/**
 * ERP-wide Semantic Tones.
 */
export const SEMANTIC_TONES: Record<string, StatusTone> = {
  active: 'success',
  approved: 'success',
  completed: 'success',
  fulfilled: 'success',
  paid: 'success',
  received: 'success',
  pending: 'warning',
  partially_shipped: 'warning',
  partially_paid: 'warning',
  partially_received: 'warning',
  awaiting_approval: 'warning',
  shipped: 'info',
  draft: 'neutral',
  inactive: 'neutral',
  open: 'info',
  sent: 'info',
  cancelled: 'danger',
  void: 'danger',
  rejected: 'danger',
  closed: 'secondary',
  archived: 'secondary',
  posted: 'success',
  failed: 'danger',
  refunded: 'danger',
  accepted: 'success',
  revoked: 'danger',
  inbound: 'teal',
  outbound: 'indigo',
};

/**
 * Resolves a semantic tone for a given status key.
 */
export function getStatusTone(status: string, defaultTone: StatusTone = 'neutral'): StatusTone {
  const normalized = status.toLowerCase();
  return SEMANTIC_TONES[normalized] || defaultTone;
}

/**
 * Utility to construct a StatusMap with standard ERP tones.
 */
export function createStatusMap<T extends string>(
  statusLabels: Record<T, string>,
  overrides?: Partial<Record<T, StatusTone>>,
): StatusMap<T> {
  const map: Partial<StatusMap<T>> = {};
  for (const [key, label] of Object.entries(statusLabels) as [T, string][]) {
    map[key] = {
      label,
      tone: overrides?.[key] || getStatusTone(key),
    };
  }
  return map as StatusMap<T>;
}
