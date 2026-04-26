import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from '@shared/contracts/warehouses.contract';
import { addressSchema } from '@shared/contracts/common.contract';
import { binSchema } from '@shared/contracts/warehouses.contract';

export interface RawAddressResponse {
  id: string;
  isPrimary: boolean;
  address: {
    id: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    country: string;
    name?: string | null;
  };
}

export interface WarehouseResponse {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  addresses: z.infer<typeof addressSchema>[];
  bins: z.infer<typeof binSchema>[];
}

interface RawWarehouseResponse extends Omit<WarehouseResponse, 'addresses' | 'bins'> {
  addresses: RawAddressResponse[];
  bins: z.infer<typeof binSchema>[];
}

function mapWarehouse(raw: RawWarehouseResponse): WarehouseResponse {
  return {
    ...raw,
    addresses: (raw.addresses || []).map((ra) => ({
      ...ra.address,
      id: ra.address.id,
      isPrimary: ra.isPrimary,
    })),
    bins: raw.bins || [],
  };
}

export const warehousesApi = {
  fetchWarehouses: async () => {
    const raw = await apiFetch<RawWarehouseResponse[]>('/warehouses');
    return raw.map(mapWarehouse);
  },
  fetchWarehouse: async (id: string) => {
    const raw = await apiFetch<RawWarehouseResponse>(`/warehouses/${id}`);
    return mapWarehouse(raw);
  },
  createWarehouse: async (data: CreateWarehouseInput) => {
    const raw = await apiFetch<RawWarehouseResponse>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapWarehouse(raw);
  },
  updateWarehouse: async (id: string, data: UpdateWarehouseInput) => {
    const raw = await apiFetch<RawWarehouseResponse>(`/warehouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapWarehouse(raw);
  },
  deleteWarehouse: (id: string) =>
    apiFetch<{ message: string }>(`/warehouses/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteWarehouses: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/warehouses', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
