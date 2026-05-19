import { apiFetch } from '@/lib/api';
import type { CreateTaxInput, UpdateTaxInput } from '@shared/contracts/taxes.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface TaxResponse {
  id: string;
  name: string;
  rate: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const taxesApi = {
  fetchTaxes: () => apiFetch<TaxResponse[]>(API_ENDPOINTS.setup.taxes.base),
  fetchTax: (id: string) => apiFetch<TaxResponse>(API_ENDPOINTS.setup.taxes.detail(id)),
  createTax: (data: CreateTaxInput) =>
    apiFetch<TaxResponse>(API_ENDPOINTS.setup.taxes.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTax: (id: string, data: UpdateTaxInput) =>
    apiFetch<TaxResponse>(API_ENDPOINTS.setup.taxes.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTax: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.setup.taxes.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteTaxes: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>(
      API_ENDPOINTS.setup.taxes.base, // Using base as bulkDelete in API_ENDPOINTS for setup is also root. Wait, let me check.
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      },
    ),
};
