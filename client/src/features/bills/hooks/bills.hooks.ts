import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateBillInput,
  UpdateBillInput,
  UpdateBillStatusInput,
} from '@shared/contracts/bills.contract';
import { billsApi } from '../api/bills.api';
import { activityKeys } from '../../activity/hooks/activity.hooks';
import { purchaseOrderKeys } from '../../purchase-orders/hooks/purchase-orders.hooks';

export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'list'] as const,
  list: (filters: string) => [...billKeys.lists(), { filters }] as const,
  details: () => [...billKeys.all, 'detail'] as const,
  detail: (id: string) => [...billKeys.details(), id] as const,
};

export const billDetailQuery = (id: string) =>
  queryOptions({
    queryKey: billKeys.detail(id),
    queryFn: () => billsApi.fetchBill(id),
  });

export const billListQuery = () =>
  queryOptions({
    queryKey: billKeys.lists(),
    queryFn: billsApi.fetchBills,
    staleTime: 5000,
  });

export function useBillsQuery() {
  return useQuery(billListQuery());
}

export function useBillsActions() {
  const queryClient = useQueryClient();

  return {
    invalidateBills: () => queryClient.invalidateQueries({ queryKey: billKeys.lists() }),
  };
}

export function useBill(id: string | undefined) {
  return useQuery({
    ...billDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBillInput) => billsApi.createBill(data),
    onSuccess: (data) => {
      queryClient.setQueryData(billKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillInput }) =>
      billsApi.updateBill(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(billKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateBillStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillStatusInput }) =>
      billsApi.updateBillStatus(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(billKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billsApi.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useBulkDeleteBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => billsApi.bulkDeleteBills(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
    },
  });
}

export function useCreateBillFromReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (receiptId: string) => billsApi.createFromReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
