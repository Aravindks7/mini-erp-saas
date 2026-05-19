import { createStatusMap } from '@/lib/status-utils';

export const SUPPLIER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type SupplierStatus = (typeof SUPPLIER_STATUS)[keyof typeof SUPPLIER_STATUS];

export const supplierStatusMap = createStatusMap({
  [SUPPLIER_STATUS.ACTIVE]: 'Active',
  [SUPPLIER_STATUS.INACTIVE]: 'Inactive',
});
