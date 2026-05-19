import { createStatusMap } from '@/lib/status-utils';

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const productStatusMap = createStatusMap({
  [PRODUCT_STATUS.ACTIVE]: 'Active',
  [PRODUCT_STATUS.INACTIVE]: 'Inactive',
});
