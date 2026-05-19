import { createStatusMap } from '@/lib/status-utils';

export const SHIPMENT_STATUS = {
  DRAFT: 'draft',
  SHIPPED: 'shipped',
  CANCELLED: 'cancelled',
} as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUS)[keyof typeof SHIPMENT_STATUS];

export const shipmentStatusMap = createStatusMap({
  [SHIPMENT_STATUS.DRAFT]: 'Draft',
  [SHIPMENT_STATUS.SHIPPED]: 'Shipped',
  [SHIPMENT_STATUS.CANCELLED]: 'Cancelled',
});
