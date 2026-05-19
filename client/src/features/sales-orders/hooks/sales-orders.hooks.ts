import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';
import type { ActivityAction } from '@shared/config/activity-actions.config';
import { salesOrdersApi, type SOStatus } from '../api/sales-orders.api';
import { activityKeys } from '../../activity/hooks/activity.hooks';

export const salesOrderKeys = {
  all: ['sales-orders'] as const,
  lists: () => [...salesOrderKeys.all, 'list'] as const,
  details: () => [...salesOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...salesOrderKeys.details(), id] as const,
};

export const salesOrderDetailQuery = (id: string) =>
  queryOptions({
    queryKey: salesOrderKeys.detail(id),
    queryFn: () => salesOrdersApi.fetchSalesOrder(id),
  });

export const salesOrderListQuery = () =>
  queryOptions({
    queryKey: salesOrderKeys.lists(),
    queryFn: salesOrdersApi.fetchSalesOrders,
    staleTime: 5000,
  });

export function useSalesOrdersQuery() {
  return useQuery(salesOrderListQuery());
}

export function useSalesOrdersActions() {
  const queryClient = useQueryClient();

  return {
    invalidateSalesOrders: () =>
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() }),
  };
}

export function useSalesOrder(id: string | undefined) {
  return useQuery({
    ...salesOrderDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderInput) => salesOrdersApi.createSalesOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalesOrderInput }) =>
      salesOrdersApi.updateSalesOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersApi.deleteSalesOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useBulkDeleteSalesOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => salesOrdersApi.bulkDeleteSalesOrders(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateSalesOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      action,
      reason,
    }: {
      id: string;
      status: SOStatus;
      action: ActivityAction;
      reason: string;
    }) => salesOrdersApi.updateSalesOrderStatus(id, status, action, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(salesOrderKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
