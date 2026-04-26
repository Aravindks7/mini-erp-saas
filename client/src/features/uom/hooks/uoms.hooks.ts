import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreateUomInput, UpdateUomInput } from '@shared/contracts/uom.contract';
import { uomsApi } from '../api/uoms.api';

export const uomKeys = {
  all: ['uoms'] as const,
  lists: () => [...uomKeys.all, 'list'] as const,
  list: (filters: string) => [...uomKeys.lists(), { filters }] as const,
  details: () => [...uomKeys.all, 'detail'] as const,
  detail: (id: string) => [...uomKeys.details(), id] as const,
};

export const uomDetailQuery = (id: string) =>
  queryOptions({
    queryKey: uomKeys.detail(id),
    queryFn: () => uomsApi.fetchUom(id),
  });

export function useUoms() {
  return useQuery({
    queryKey: uomKeys.lists(),
    queryFn: uomsApi.fetchUoms,
    staleTime: 5000,
  });
}

export function useUom(id: string | undefined) {
  return useQuery({
    ...uomDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateUom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUomInput) => uomsApi.createUom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
    },
  });
}

export function useUpdateUom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUomInput }) => uomsApi.updateUom(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: uomKeys.detail(data.id) });
    },
  });
}

export function useDeleteUom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => uomsApi.deleteUom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
    },
  });
}

export function useBulkDeleteUoms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => uomsApi.bulkDeleteUoms(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: uomKeys.lists() });
    },
  });
}
