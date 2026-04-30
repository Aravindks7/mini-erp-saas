import { apiFetch } from '@/lib/api';
import type { CreateSalesOrderInput } from '@shared/contracts/sales-orders.contract';

export interface SalesOrderLineResponse {
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

export interface SalesOrderResponse {
  id: string;
  customerId: string;
  documentNumber: string;
  status: 'draft' | 'approved' | 'partially_shipped' | 'shipped' | 'cancelled';
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
  };
  lines: SalesOrderLineResponse[];
}

export const salesOrdersApi = {
  fetchSalesOrders: () => apiFetch<SalesOrderResponse[]>('/sales-orders'),
  fetchSalesOrder: (id: string) => apiFetch<SalesOrderResponse>(`/sales-orders/${id}`),
  createSalesOrder: (data: CreateSalesOrderInput) =>
    apiFetch<SalesOrderResponse>('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSalesOrder: (id: string, data: CreateSalesOrderInput) =>
    apiFetch<SalesOrderResponse>(`/sales-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSalesOrder: (id: string) =>
    apiFetch<void>(`/sales-orders/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteSalesOrders: (ids: string[]) =>
    apiFetch<void>('/sales-orders', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
