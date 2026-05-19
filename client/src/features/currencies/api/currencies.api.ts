import { apiFetch } from '@/lib/api';
import type {
  CreateCurrencyInput,
  UpdateCurrencyInput,
  CurrencyResponse,
} from '@shared/contracts/currencies.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const currenciesApi = {
  fetchCurrencies: async () => {
    return await apiFetch<CurrencyResponse[]>(API_ENDPOINTS.setup.currencies.base);
  },
  fetchCurrency: async (id: string) => {
    return await apiFetch<CurrencyResponse>(API_ENDPOINTS.setup.currencies.detail(id));
  },
  createCurrency: async (data: CreateCurrencyInput) => {
    return await apiFetch<CurrencyResponse>(API_ENDPOINTS.setup.currencies.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateCurrency: async (id: string, data: UpdateCurrencyInput) => {
    return await apiFetch<CurrencyResponse>(API_ENDPOINTS.setup.currencies.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteCurrency: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.setup.currencies.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteCurrencies: (ids: string[]) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.setup.currencies.bulkDelete, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};
