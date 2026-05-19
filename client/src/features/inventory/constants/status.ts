import { createStatusMap } from '@/lib/status-utils';

export const TRANSFER_STATUS = {
  DRAFT: 'draft',
  SHIPPED: 'shipped',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
} as const;

export type TransferStatus = (typeof TRANSFER_STATUS)[keyof typeof TRANSFER_STATUS];

export const transferStatusMap = createStatusMap({
  [TRANSFER_STATUS.DRAFT]: 'Draft',
  [TRANSFER_STATUS.SHIPPED]: 'Shipped',
  [TRANSFER_STATUS.RECEIVED]: 'Received',
  [TRANSFER_STATUS.CANCELLED]: 'Cancelled',
});

export const ADJUSTMENT_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  CANCELLED: 'cancelled',
} as const;

export type AdjustmentStatus = (typeof ADJUSTMENT_STATUS)[keyof typeof ADJUSTMENT_STATUS];

export const adjustmentStatusMap = createStatusMap({
  [ADJUSTMENT_STATUS.DRAFT]: 'Draft',
  [ADJUSTMENT_STATUS.APPROVED]: 'Approved',
  [ADJUSTMENT_STATUS.CANCELLED]: 'Cancelled',
});

export const referenceTypeStatusMap = createStatusMap(
  {
    po_receipt: 'PO Receipt',
    so_shipment: 'SO Shipment',
    adjustment: 'Adjustment',
    transfer: 'Transfer',
    stock_count: 'Stock Count',
  },
  {
    so_shipment: 'warning',
    adjustment: 'purple',
    transfer: 'indigo',
    stock_count: 'teal',
  },
);
