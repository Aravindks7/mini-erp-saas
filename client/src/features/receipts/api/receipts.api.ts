import { apiFetch } from '@/lib/api';
import type { CreateReceiptInput } from '@shared/contracts/receipts.contract';

export interface ReceiptLineResponse {
  id: string;
  receiptId: string;
  productId: string;
  warehouseId: string;
  binId?: string | null;
  quantityReceived: string;
  purchaseOrderLineId?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  warehouse?: {
    id: string;
    name: string;
  };
  bin?: {
    id: string;
    name: string;
  } | null;
}

export interface ReceiptResponse {
  id: string;
  receiptNumber: string;
  receivedDate: string;
  reference?: string | null;
  status: 'draft' | 'received' | 'cancelled';
  purchaseOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  lines: ReceiptLineResponse[];
  purchaseOrder?: {
    id: string;
    documentNumber: string;
  } | null;
}

export const receiptsApi = {
  fetchReceipts: () => apiFetch<ReceiptResponse[]>('/receipts'),
  fetchReceipt: (id: string) => apiFetch<ReceiptResponse>(`/receipts/${id}`),
  createReceipt: (data: CreateReceiptInput) =>
    apiFetch<ReceiptResponse>('/receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
