import { apiFetch } from '@/lib/api';
import type { CreateShipmentInput } from '@shared/contracts/shipments.contract';

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
  fetchShipments: () => apiFetch<ShipmentResponse[]>('/shipments'),
  fetchShipment: (id: string) => apiFetch<ShipmentResponse>(`/shipments/${id}`),
  createShipment: (data: CreateShipmentInput) =>
    apiFetch<ShipmentResponse>('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
