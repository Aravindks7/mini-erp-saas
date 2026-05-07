import { apiFetch } from '@/lib/api';
import type { CreateJournalEntryInput } from '@shared/contracts/finance.contract';
import type { AccountResponse } from '@/features/accounts/api/accounts.api';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface JournalEntryLineResponse {
  id: string;
  journalEntryId: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string | null;
  organizationId: string;
  account: AccountResponse;
}

export interface JournalEntryResponse {
  id: string;
  date: string;
  reference: string | null;
  description: string | null;
  status: 'draft' | 'posted' | 'void';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  lines: JournalEntryLineResponse[];
}

export const journalEntriesApi = {
  fetchJournalEntries: async () => {
    return apiFetch<JournalEntryResponse[]>(API_ENDPOINTS.finance.journalEntries.base);
  },
  fetchJournalEntry: async (id: string) => {
    return apiFetch<JournalEntryResponse>(API_ENDPOINTS.finance.journalEntries.detail(id));
  },
  createJournalEntry: async (data: CreateJournalEntryInput) => {
    return apiFetch<JournalEntryResponse>(API_ENDPOINTS.finance.journalEntries.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  voidJournalEntry: async (id: string) => {
    return apiFetch<JournalEntryResponse>(API_ENDPOINTS.finance.journalEntries.void(id), {
      method: 'POST',
    });
  },
};
