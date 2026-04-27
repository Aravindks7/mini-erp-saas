import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateSalesOrderInput,
  FulfillSalesOrderInput,
} from '@shared/contracts/sales-orders.contract';
import { salesOrdersApi } from '../api/sales-orders.api';

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

export function useSalesOrders() {
  return useQuery({
    queryKey: salesOrderKeys.lists(),
    queryFn: salesOrdersApi.fetchSalesOrders,
    staleTime: 5000,
  });
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
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSalesOrderInput }) =>
      salesOrdersApi.updateSalesOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(data.id) });
    },
  });
}

export function useFulfillSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FulfillSalesOrderInput }) =>
      salesOrdersApi.fulfillSalesOrder(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(data.id) });
      // Invalidate inventory keys as well since fulfillment outtakes stock
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
