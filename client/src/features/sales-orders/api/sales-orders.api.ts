import { apiFetch } from '@/lib/api';
import type { CreateSalesOrderInput } from '@shared/contracts/sales-orders.contract';
import type { ActivityAction } from '@shared/config/activity-actions.config';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface SalesOrderLineResponse {
  id: string;
  productId: string;
  quantity: string;
  quantityShipped: string;
  unitPrice: string;
  taxRateAtOrder: string;
  taxAmount: string;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

export type SOStatus =
  | 'draft'
  | 'approved'
  | 'partially_shipped'
  | 'shipped'
  | 'closed'
  | 'cancelled';

export interface SalesOrderResponse {
  id: string;
  customerId: string;
  documentNumber: string;
  status: SOStatus;
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
  fetchSalesOrders: () => apiFetch<SalesOrderResponse[]>(API_ENDPOINTS.sales.orders.base),
  fetchSalesOrder: (id: string) =>
    apiFetch<SalesOrderResponse>(API_ENDPOINTS.sales.orders.detail(id)),
  createSalesOrder: (data: CreateSalesOrderInput) =>
    apiFetch<SalesOrderResponse>(API_ENDPOINTS.sales.orders.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSalesOrder: (id: string, data: CreateSalesOrderInput) =>
    apiFetch<SalesOrderResponse>(API_ENDPOINTS.sales.orders.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateSalesOrderStatus: (
    id: string,
    status: SalesOrderResponse['status'],
    action: ActivityAction,
    reason: string,
  ) =>
    apiFetch<SalesOrderResponse>(API_ENDPOINTS.sales.orders.status(id), {
      method: 'PATCH',
      body: JSON.stringify({ status, action, reason }),
    }),
  deleteSalesOrder: (id: string) =>
    apiFetch<void>(API_ENDPOINTS.sales.orders.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteSalesOrders: (ids: string[]) =>
    apiFetch<void>(API_ENDPOINTS.sales.orders.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
