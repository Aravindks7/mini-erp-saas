import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreateReceiptInput, UpdateReceiptInput } from '@shared/contracts/receipts.contract';
import { receiptsApi } from '../api/receipts.api';
import { toast } from 'sonner';
import { purchaseOrderKeys } from '../../purchase-orders/hooks/purchase-orders.hooks';
import { inventoryKeys } from '../../inventory/hooks/inventory.hooks';
import { activityKeys } from '../../activity/hooks/activity.hooks';

export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  details: () => [...receiptKeys.all, 'detail'] as const,
  detail: (id: string) => [...receiptKeys.details(), id] as const,
};

export const receiptDetailQuery = (id: string) =>
  queryOptions({
    queryKey: receiptKeys.detail(id),
    queryFn: () => receiptsApi.fetchReceipt(id),
  });

export const receiptListQuery = () =>
  queryOptions({
    queryKey: receiptKeys.lists(),
    queryFn: receiptsApi.fetchReceipts,
  });

export function useReceiptsQuery() {
  return useQuery(receiptListQuery());
}

export function useReceiptsActions() {
  const queryClient = useQueryClient();

  return {
    invalidateReceipts: () => queryClient.invalidateQueries({ queryKey: receiptKeys.lists() }),
  };
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    ...receiptDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReceiptInput) => receiptsApi.createReceipt(data),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Receipt created successfully');
    },
    onError: (error) => {
      console.error('Failed to create receipt:', error);
      toast.error('Failed to create receipt');
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => receiptsApi.deleteReceipt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Receipt deleted and inventory reversed');
    },
    onError: (error) => {
      console.error('Failed to delete receipt:', error);
      toast.error('Failed to delete receipt');
    },
  });
}

export function useBulkDeleteReceipts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => receiptsApi.bulkDeleteReceipts(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Receipts deleted and inventory reversed');
    },
    onError: (error) => {
      console.error('Failed to bulk delete receipts:', error);
      toast.error('Failed to bulk delete receipts');
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReceiptInput }) =>
      receiptsApi.updateReceipt(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(receiptKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Receipt updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update receipt:', error);
      toast.error('Failed to update receipt');
    },
  });
}
