import { createStatusMap } from '@/lib/status-utils';

export const RECEIPT_STATUS = {
  DRAFT: 'draft',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type ReceiptStatus = (typeof RECEIPT_STATUS)[keyof typeof RECEIPT_STATUS];

export const receiptStatusMap = createStatusMap({
  [RECEIPT_STATUS.DRAFT]: 'Draft',
  [RECEIPT_STATUS.COMPLETED]: 'Completed',
  [RECEIPT_STATUS.CANCELLED]: 'Cancelled',
});
