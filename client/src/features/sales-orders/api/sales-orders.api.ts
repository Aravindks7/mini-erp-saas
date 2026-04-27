import { apiFetch } from '@/lib/api';
import type {
  CreateSalesOrderInput,
  FulfillSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';

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
  status: 'draft' | 'approved' | 'shipped' | 'cancelled';
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
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
  fulfillSalesOrder: (id: string, data: FulfillSalesOrderInput) =>
    apiFetch<{ id: string; status: 'shipped' }>(`/sales-orders/${id}/fulfill`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
