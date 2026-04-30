import { apiFetch } from '@/lib/api';
import type { CreatePurchaseOrderInput } from '@shared/contracts/purchase-orders.contract';

export interface PurchaseOrderLineResponse {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  taxRateAtOrder: string;
  taxAmount: string;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface PurchaseOrderResponse {
  id: string;
  supplierId: string;
  documentNumber: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    name: string;
  };
  lines: PurchaseOrderLineResponse[];
}

export const purchaseOrdersApi = {
  fetchPurchaseOrders: () => apiFetch<PurchaseOrderResponse[]>('/purchase-orders'),
  fetchPurchaseOrder: (id: string) => apiFetch<PurchaseOrderResponse>(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: CreatePurchaseOrderInput) =>
    apiFetch<PurchaseOrderResponse>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePurchaseOrder: (id: string, data: CreatePurchaseOrderInput) =>
    apiFetch<PurchaseOrderResponse>(`/purchase-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePurchaseOrder: (id: string) =>
    apiFetch<void>(`/purchase-orders/${id}`, {
      method: 'DELETE',
    }),
  bulkDeletePurchaseOrders: (ids: string[]) =>
    apiFetch<void>('/purchase-orders', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
