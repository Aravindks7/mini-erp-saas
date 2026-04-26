import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from '@shared/contracts/warehouses.contract';
import { warehousesApi } from '../api/warehouses.api';

export const warehouseKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehouseKeys.all, 'list'] as const,
  list: (filters: string) => [...warehouseKeys.lists(), { filters }] as const,
  details: () => [...warehouseKeys.all, 'detail'] as const,
  detail: (id: string) => [...warehouseKeys.details(), id] as const,
};

export const warehouseDetailQuery = (id: string) =>
  queryOptions({
    queryKey: warehouseKeys.detail(id),
    queryFn: () => warehousesApi.fetchWarehouse(id),
  });

export function useWarehouses() {
  return useQuery({
    queryKey: warehouseKeys.lists(),
    queryFn: warehousesApi.fetchWarehouses,
    staleTime: 5000,
  });
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    ...warehouseDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehouseInput) => warehousesApi.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehouseInput }) =>
      warehousesApi.updateWarehouse(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: warehouseKeys.detail(data.id) });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehousesApi.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}

export function useBulkDeleteWarehouses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => warehousesApi.bulkDeleteWarehouses(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warehouseKeys.lists() });
    },
  });
}
