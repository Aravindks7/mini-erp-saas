import { createStatusMap } from '@/lib/status-utils';

export const BILL_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  VOID: 'void',
} as const;

export type BillStatus = (typeof BILL_STATUS)[keyof typeof BILL_STATUS];

export const billStatusMap = createStatusMap({
  [BILL_STATUS.DRAFT]: 'Draft',
  [BILL_STATUS.OPEN]: 'Open',
  [BILL_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [BILL_STATUS.PAID]: 'Paid',
  [BILL_STATUS.VOID]: 'Void',
});
