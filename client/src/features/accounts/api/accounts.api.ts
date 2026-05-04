import { apiFetch } from '@/lib/api';
import type { CreateAccountInput, UpdateAccountInput } from '@shared/contracts/finance.contract';

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
    return apiFetch<AccountResponse[]>('/finance/accounts');
  },
  fetchAccount: async (id: string) => {
    return apiFetch<AccountResponse>(`/finance/accounts/${id}`);
  },
  createAccount: async (data: CreateAccountInput) => {
    return apiFetch<AccountResponse>('/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAccount: async (id: string, data: UpdateAccountInput) => {
    return apiFetch<AccountResponse>(`/finance/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteAccount: (id: string) =>
    apiFetch<{ message: string }>(`/finance/accounts/${id}`, {
      method: 'DELETE',
    }),
};
