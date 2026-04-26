import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@shared/contracts/suppliers.contract';
import { addressSchema, contactSchema } from '@shared/contracts/common.contract';

export interface RawAddressResponse {
  id: string;
  isPrimary: boolean;
  addressType: string | null;
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

export interface RawContactResponse {
  id: string;
  isPrimary: boolean;
  contact: {
    id: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
  };
}

export interface SupplierResponse {
  id: string;
  name: string;
  taxNumber?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  addresses: z.infer<typeof addressSchema>[];
  contacts: z.infer<typeof contactSchema>[];
}

interface RawSupplierResponse extends Omit<SupplierResponse, 'addresses' | 'contacts'> {
  addresses: RawAddressResponse[];
  contacts: RawContactResponse[];
}

function mapSupplier(raw: RawSupplierResponse): SupplierResponse {
  return {
    ...raw,
    addresses: (raw.addresses || []).map((ra) => ({
      ...ra.address,
      id: ra.address.id,
      isPrimary: ra.isPrimary,
      addressType: ra.addressType,
    })),
    contacts: (raw.contacts || []).map((rc) => ({
      ...rc.contact,
      id: rc.contact.id,
      isPrimary: rc.isPrimary,
    })),
  };
}

export const suppliersApi = {
  fetchSuppliers: async () => {
    const raw = await apiFetch<RawSupplierResponse[]>('/suppliers');
    return raw.map(mapSupplier);
  },
  fetchSupplier: async (id: string) => {
    const raw = await apiFetch<RawSupplierResponse>(`/suppliers/${id}`);
    return mapSupplier(raw);
  },
  createSupplier: async (data: CreateSupplierInput) => {
    const raw = await apiFetch<RawSupplierResponse>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapSupplier(raw);
  },
  updateSupplier: async (id: string, data: UpdateSupplierInput) => {
    const raw = await apiFetch<RawSupplierResponse>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapSupplier(raw);
  },
  deleteSupplier: (id: string) =>
    apiFetch<{ message: string }>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteSuppliers: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/suppliers', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
