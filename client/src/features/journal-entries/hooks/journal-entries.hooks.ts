import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreateJournalEntryInput } from '@shared/contracts/finance.contract';
import { journalEntriesApi } from '../api/journal-entries.api';

export const journalEntryKeys = {
  all: ['journal-entries'] as const,
  lists: () => [...journalEntryKeys.all, 'list'] as const,
  details: () => [...journalEntryKeys.all, 'detail'] as const,
  detail: (id: string) => [...journalEntryKeys.details(), id] as const,
};

export const journalEntryDetailQuery = (id: string) =>
  queryOptions({
    queryKey: journalEntryKeys.detail(id),
    queryFn: () => journalEntriesApi.fetchJournalEntry(id),
  });

export function useJournalEntries() {
  return useQuery({
    queryKey: journalEntryKeys.lists(),
    queryFn: journalEntriesApi.fetchJournalEntries,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useJournalEntry(id: string | undefined) {
  return useQuery({
    ...journalEntryDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalEntryInput) => journalEntriesApi.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.lists() });
    },
  });
}

export function useVoidJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalEntriesApi.voidJournalEntry(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.detail(data.id) });
    },
  });
}
