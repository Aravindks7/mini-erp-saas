import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreateTaxInput, UpdateTaxInput } from '@shared/contracts/taxes.contract';
import { taxesApi } from '../api/taxes.api';

export const taxKeys = {
  all: ['taxes'] as const,
  lists: () => [...taxKeys.all, 'list'] as const,
  list: (filters: string) => [...taxKeys.lists(), { filters }] as const,
  details: () => [...taxKeys.all, 'detail'] as const,
  detail: (id: string) => [...taxKeys.details(), id] as const,
};

export const taxDetailQuery = (id: string) =>
  queryOptions({
    queryKey: taxKeys.detail(id),
    queryFn: () => taxesApi.fetchTax(id),
  });

export function useTaxes() {
  return useQuery({
    queryKey: taxKeys.lists(),
    queryFn: taxesApi.fetchTaxes,
    staleTime: 5000,
  });
}

export function useTax(id: string | undefined) {
  return useQuery({
    ...taxDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaxInput) => taxesApi.createTax(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.lists() });
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxInput }) =>
      taxesApi.updateTax(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taxKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taxKeys.detail(data.id) });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taxesApi.deleteTax(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.lists() });
    },
  });
}

export function useBulkDeleteTaxes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => taxesApi.bulkDeleteTaxes(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.lists() });
    },
  });
}
