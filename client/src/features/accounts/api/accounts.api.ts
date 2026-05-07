import { apiFetch } from '@/lib/api';
import type { CreateAccountInput, UpdateAccountInput } from '@shared/contracts/finance.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface AccountResponse {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype: string | null;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  isSystem: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export const accountsApi = {
  fetchAccounts: async () => {
    return apiFetch<AccountResponse[]>(API_ENDPOINTS.finance.accounts.base);
  },
  fetchAccount: async (id: string) => {
    return apiFetch<AccountResponse>(API_ENDPOINTS.finance.accounts.detail(id));
  },
  createAccount: async (data: CreateAccountInput) => {
    return apiFetch<AccountResponse>(API_ENDPOINTS.finance.accounts.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAccount: async (id: string, data: UpdateAccountInput) => {
    return apiFetch<AccountResponse>(API_ENDPOINTS.finance.accounts.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteAccount: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.finance.accounts.detail(id), {
      method: 'DELETE',
    }),
};
