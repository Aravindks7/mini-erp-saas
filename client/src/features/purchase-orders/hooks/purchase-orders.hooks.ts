import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreatePurchaseOrderInput } from '@shared/contracts/purchase-orders.contract';
import { purchaseOrdersApi } from '../api/purchase-orders.api';

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
};

export const purchaseOrderDetailQuery = (id: string) =>
  queryOptions({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrdersApi.fetchPurchaseOrder(id),
  });

export function usePurchaseOrders() {
  return useQuery({
    queryKey: purchaseOrderKeys.lists(),
    queryFn: purchaseOrdersApi.fetchPurchaseOrders,
    staleTime: 5000,
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    ...purchaseOrderDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderInput) => purchaseOrdersApi.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePurchaseOrderInput }) =>
      purchaseOrdersApi.updatePurchaseOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.id) });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useBulkDeletePurchaseOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => purchaseOrdersApi.bulkDeletePurchaseOrders(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}
