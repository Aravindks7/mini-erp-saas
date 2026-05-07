import { apiFetch } from '@/lib/api';
import type { CreateShipmentInput } from '@shared/contracts/shipments.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface ShipmentLineResponse {
  id: string;
  shipmentId: string;
  productId: string;
  warehouseId: string;
  binId?: string | null;
  quantityShipped: string;
  salesOrderLineId?: string | null;
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

export interface ShipmentResponse {
  id: string;
  shipmentNumber: string;
  shipmentDate: string;
  reference?: string | null;
  status: 'draft' | 'shipped' | 'cancelled';
  salesOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
  lines: ShipmentLineResponse[];
  salesOrder?: {
    id: string;
    documentNumber: string;
  } | null;
}

export const shipmentsApi = {
  fetchShipments: () => apiFetch<ShipmentResponse[]>(API_ENDPOINTS.sales.shipments.base),
  fetchShipment: (id: string) =>
    apiFetch<ShipmentResponse>(API_ENDPOINTS.sales.shipments.detail(id)),
  createShipment: (data: CreateShipmentInput) =>
    apiFetch<ShipmentResponse>(API_ENDPOINTS.sales.shipments.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteShipment: (id: string) =>
    apiFetch<void>(API_ENDPOINTS.sales.shipments.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteShipments: (ids: string[]) =>
    apiFetch<void>(API_ENDPOINTS.sales.shipments.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
