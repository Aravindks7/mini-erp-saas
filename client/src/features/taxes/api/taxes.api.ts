import { apiFetch } from '@/lib/api';
import type { CreateTaxInput, UpdateTaxInput } from '@shared/contracts/taxes.contract';

export interface TaxResponse {
  id: string;
  name: string;
  rate: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const taxesApi = {
  fetchTaxes: () => apiFetch<TaxResponse[]>('/taxes'),
  fetchTax: (id: string) => apiFetch<TaxResponse>(`/taxes/${id}`),
  createTax: (data: CreateTaxInput) =>
    apiFetch<TaxResponse>('/taxes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTax: (id: string, data: UpdateTaxInput) =>
    apiFetch<TaxResponse>(`/taxes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTax: (id: string) =>
    apiFetch<{ message: string }>(`/taxes/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteTaxes: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/taxes', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
