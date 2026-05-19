import { createStatusMap } from '@/lib/status-utils';

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const paymentStatusMap = createStatusMap({
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.COMPLETED]: 'Completed',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
});

export const PAYMENT_TYPE = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
} as const;

export const paymentTypeMap = createStatusMap({
  [PAYMENT_TYPE.INBOUND]: 'Inbound',
  [PAYMENT_TYPE.OUTBOUND]: 'Outbound',
});

export const intentStatusMap = createStatusMap(
  {
    pending: 'Pending',
    succeeded: 'Succeeded',
    failed: 'Failed',
    expired: 'Expired',
  },
  {
    succeeded: 'success',
    failed: 'danger',
  },
);
