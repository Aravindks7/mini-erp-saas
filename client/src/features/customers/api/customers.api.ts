import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  addressSchema,
  contactSchema,
} from '@shared/contracts/customers.contract';

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

export interface CustomerResponse {
  id: string;
  companyName: string;
  taxNumber?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  addresses: z.infer<typeof addressSchema>[];
  contacts: z.infer<typeof contactSchema>[];
}

interface RawCustomerResponse extends Omit<CustomerResponse, 'addresses' | 'contacts'> {
  addresses: RawAddressResponse[];
  contacts: RawContactResponse[];
}

function mapCustomer(raw: RawCustomerResponse): CustomerResponse {
  return {
    ...raw,
    addresses: (raw.addresses || []).map((ra) => ({
      ...ra.address,
      id: ra.address.id, // Primary Address ID
      isPrimary: ra.isPrimary,
      addressType: ra.addressType,
    })),
    contacts: (raw.contacts || []).map((rc) => ({
      ...rc.contact,
      id: rc.contact.id, // Primary Contact ID
      isPrimary: rc.isPrimary,
    })),
  };
}

export const customersApi = {
  fetchCustomers: async () => {
    const raw = await apiFetch<RawCustomerResponse[]>('/customers');
    return raw.map(mapCustomer);
  },
  fetchCustomer: async (id: string) => {
    const raw = await apiFetch<RawCustomerResponse>(`/customers/${id}`);
    return mapCustomer(raw);
  },
  createCustomer: async (data: CreateCustomerInput) => {
    const raw = await apiFetch<RawCustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapCustomer(raw);
  },
  updateCustomer: async (id: string, data: UpdateCustomerInput) => {
    const raw = await apiFetch<RawCustomerResponse>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return mapCustomer(raw);
  },
  deleteCustomer: (id: string) =>
    apiFetch<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteCustomers: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/customers', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
