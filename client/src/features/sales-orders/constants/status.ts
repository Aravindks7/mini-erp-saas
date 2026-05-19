import { createStatusMap } from '@/lib/status-utils';

export const SALES_ORDER_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PARTIALLY_SHIPPED: 'partially_shipped',
  SHIPPED: 'shipped',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export type SalesOrderStatus = (typeof SALES_ORDER_STATUS)[keyof typeof SALES_ORDER_STATUS];

export const salesOrderStatusMap = createStatusMap({
  [SALES_ORDER_STATUS.DRAFT]: 'Draft',
  [SALES_ORDER_STATUS.APPROVED]: 'Approved',
  [SALES_ORDER_STATUS.PARTIALLY_SHIPPED]: 'Partially Shipped',
  [SALES_ORDER_STATUS.SHIPPED]: 'Shipped',
  [SALES_ORDER_STATUS.CLOSED]: 'Closed',
  [SALES_ORDER_STATUS.CANCELLED]: 'Cancelled',
});
