import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateReceiptInput } from '@shared/contracts/receipts.contract';
import { receiptsApi } from '../api/receipts.api';
import { toast } from 'sonner';

export const receiptKeys = {
  all: ['receipts'] as const,
  lists: () => [...receiptKeys.all, 'list'] as const,
  details: () => [...receiptKeys.all, 'detail'] as const,
  detail: (id: string) => [...receiptKeys.details(), id] as const,
};

export function useReceipts() {
  return useQuery({
    queryKey: receiptKeys.lists(),
    queryFn: receiptsApi.fetchReceipts,
  });
}

export function useReceipt(id: string | undefined) {
  return useQuery({
    queryKey: receiptKeys.detail(id || ''),
    queryFn: () => receiptsApi.fetchReceipt(id!),
    enabled: !!id,
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReceiptInput) => receiptsApi.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.lists() });
      toast.success('Receipt created successfully');
    },
    onError: (error) => {
      console.error('Failed to create receipt:', error);
      toast.error('Failed to create receipt');
    },
  });
}
