import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@shared/contracts/purchase-orders.contract';
import { purchaseOrdersApi, type PurchaseOrderResponse } from '../api/purchase-orders.api';
import { activityKeys } from '../../activity/hooks/activity.hooks';

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

export const purchaseOrderListQuery = () =>
  queryOptions({
    queryKey: purchaseOrderKeys.lists(),
    queryFn: purchaseOrdersApi.fetchPurchaseOrders,
    staleTime: 5000,
  });

export function usePurchaseOrdersQuery() {
  return useQuery(purchaseOrderListQuery());
}

export function usePurchaseOrdersActions() {
  const queryClient = useQueryClient();

  return {
    invalidatePurchaseOrders: () =>
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() }),
  };
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
    onSuccess: (data) => {
      queryClient.setQueryData(purchaseOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePurchaseOrderInput }) =>
      purchaseOrdersApi.updatePurchaseOrder(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(purchaseOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.deletePurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useBulkDeletePurchaseOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => purchaseOrdersApi.bulkDeletePurchaseOrders(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      action,
      reason,
    }: {
      id: string;
      status: PurchaseOrderResponse['status'];
      action: string;
      reason: string;
    }) => purchaseOrdersApi.updatePurchaseOrderStatus(id, status, action, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(purchaseOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
