import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  addressSchema,
  contactSchema,
} from '@shared/contracts/customers.contract';

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

export const customersApi = {
  fetchCustomers: () => apiFetch<CustomerResponse[]>('/customers'),
  fetchCustomer: (id: string) => apiFetch<CustomerResponse>(`/customers/${id}`),
  createCustomer: (data: CreateCustomerInput) =>
    apiFetch<CustomerResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCustomer: (id: string, data: UpdateCustomerInput) =>
    apiFetch<CustomerResponse>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: string) =>
    apiFetch<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
};
