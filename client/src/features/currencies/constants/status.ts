import { createStatusMap } from '@/lib/status-utils';

export const CURRENCY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type CurrencyStatus = (typeof CURRENCY_STATUS)[keyof typeof CURRENCY_STATUS];

export const currencyStatusMap = createStatusMap({
  [CURRENCY_STATUS.ACTIVE]: 'Active',
  [CURRENCY_STATUS.INACTIVE]: 'Inactive',
});
