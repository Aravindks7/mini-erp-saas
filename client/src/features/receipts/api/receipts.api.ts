import { apiFetch } from '@/lib/api';
import type { CreateReceiptInput } from '@shared/contracts/receipts.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  fetchReceipts: () => apiFetch<ReceiptResponse[]>(API_ENDPOINTS.purchasing.receipts.base),
  fetchReceipt: (id: string) =>
    apiFetch<ReceiptResponse>(API_ENDPOINTS.purchasing.receipts.detail(id)),
  createReceipt: (data: CreateReceiptInput) =>
    apiFetch<ReceiptResponse>(API_ENDPOINTS.purchasing.receipts.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteReceipt: (id: string) =>
    apiFetch<void>(API_ENDPOINTS.purchasing.receipts.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteReceipts: (ids: string[]) =>
    apiFetch<void>(API_ENDPOINTS.purchasing.receipts.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
