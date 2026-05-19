import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@shared/contracts/suppliers.contract';
import { suppliersApi } from '../api/suppliers.api';
import { activityKeys } from '@/features/activity/hooks/activity.hooks';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: string) => [...supplierKeys.lists(), { filters }] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
};

export const supplierDetailQuery = (id: string) =>
  queryOptions({
    queryKey: supplierKeys.detail(id),
    queryFn: () => suppliersApi.fetchSupplier(id),
  });

export const supplierListQuery = () =>
  queryOptions({
    queryKey: supplierKeys.lists(),
    queryFn: suppliersApi.fetchSuppliers,
    staleTime: 5000,
  });

export function useSuppliersQuery() {
  return useQuery(supplierListQuery());
}

export function useSuppliersActions() {
  const queryClient = useQueryClient();

  return {
    invalidateSuppliers: () => queryClient.invalidateQueries({ queryKey: supplierKeys.lists() }),
  };
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    ...supplierDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierInput) => suppliersApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierInput }) =>
      suppliersApi.updateSupplier(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(data.id) });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}

export function useBulkDeleteSuppliers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => suppliersApi.bulkDeleteSuppliers(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
