import { createStatusMap } from '@/lib/status-utils';

export const PO_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type PurchaseOrderStatus = (typeof PO_STATUS)[keyof typeof PO_STATUS];

export const purchaseOrderStatusMap = createStatusMap({
  [PO_STATUS.DRAFT]: 'Draft',
  [PO_STATUS.SENT]: 'Sent',
  [PO_STATUS.PARTIALLY_RECEIVED]: 'Partially Received',
  [PO_STATUS.RECEIVED]: 'Received',
  [PO_STATUS.CLOSED]: 'Closed',
  [PO_STATUS.CANCELLED]: 'Cancelled',
});
