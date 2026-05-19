import { createStatusMap } from '@/lib/status-utils';

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  VOID: 'void',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const invoiceStatusMap = createStatusMap({
  [INVOICE_STATUS.DRAFT]: 'Draft',
  [INVOICE_STATUS.OPEN]: 'Open',
  [INVOICE_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [INVOICE_STATUS.PAID]: 'Paid',
  [INVOICE_STATUS.VOID]: 'Void',
});
