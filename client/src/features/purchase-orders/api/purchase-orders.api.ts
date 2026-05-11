import { apiFetch } from '@/lib/api';
import type { CreatePurchaseOrderInput } from '@shared/contracts/purchase-orders.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  fetchPurchaseOrders: () =>
    apiFetch<PurchaseOrderResponse[]>(API_ENDPOINTS.purchasing.orders.base),
  fetchPurchaseOrder: (id: string) =>
    apiFetch<PurchaseOrderResponse>(API_ENDPOINTS.purchasing.orders.detail(id)),
  createPurchaseOrder: (data: CreatePurchaseOrderInput) =>
    apiFetch<PurchaseOrderResponse>(API_ENDPOINTS.purchasing.orders.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePurchaseOrder: (id: string, data: CreatePurchaseOrderInput) =>
    apiFetch<PurchaseOrderResponse>(API_ENDPOINTS.purchasing.orders.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deletePurchaseOrder: (id: string) =>
    apiFetch<void>(API_ENDPOINTS.purchasing.orders.detail(id), {
      method: 'DELETE',
    }),
  bulkDeletePurchaseOrders: (ids: string[]) =>
    apiFetch<void>(API_ENDPOINTS.purchasing.orders.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
  updatePurchaseOrderStatus: (id: string, status: string, action: string, reason: string) =>
    apiFetch<PurchaseOrderResponse>(API_ENDPOINTS.purchasing.orders.status(id), {
      method: 'PATCH',
      body: JSON.stringify({ status, action, reason }),
    }),
};
