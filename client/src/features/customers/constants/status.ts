import { createStatusMap } from '@/lib/status-utils';

export const CUSTOMER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type CustomerStatus = (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];

export const customerStatusMap = createStatusMap({
  [CUSTOMER_STATUS.ACTIVE]: 'Active',
  [CUSTOMER_STATUS.INACTIVE]: 'Inactive',
});
