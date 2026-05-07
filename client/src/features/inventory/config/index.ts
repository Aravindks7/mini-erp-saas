import { type StatusMap } from '@/components/shared/StatusBadge';

export const transferStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'warning' },
  received: { label: 'Received', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const adjustmentStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  approved: { label: 'Approved', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const referenceTypeStatusMap: StatusMap<string> = {
  po_receipt: { label: 'PO Receipt', tone: 'info' },
  so_shipment: { label: 'SO Shipment', tone: 'warning' },
  adjustment: { label: 'Adjustment', tone: 'purple' },
  transfer: { label: 'Transfer', tone: 'indigo' },
  stock_count: { label: 'Stock Count', tone: 'teal' },
};
