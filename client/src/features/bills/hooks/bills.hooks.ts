import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateBillInput,
  UpdateBillInput,
  UpdateBillStatusInput,
} from '@shared/contracts/bills.contract';
import { billsApi } from '../api/bills.api';

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

export function useBills() {
  return useQuery({
    queryKey: billKeys.lists(),
    queryFn: billsApi.fetchBills,
    staleTime: 5000,
  });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillInput }) =>
      billsApi.updateBill(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billKeys.detail(data.id) });
    },
  });
}

export function useUpdateBillStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBillStatusInput }) =>
      billsApi.updateBillStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
      queryClient.invalidateQueries({ queryKey: billKeys.detail(data.id) });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => billsApi.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}

export function useBulkDeleteBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => billsApi.bulkDeleteBills(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billKeys.lists() });
    },
  });
}
