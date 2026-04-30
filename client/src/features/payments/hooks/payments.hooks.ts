import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreatePaymentInput } from '@shared/contracts/payments.contract';
import { paymentsApi } from '../api/payments.api';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

export const paymentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsApi.getPayment(id),
  });

export function usePayments() {
  return useQuery({
    queryKey: paymentKeys.lists(),
    queryFn: paymentsApi.getPayments,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    ...paymentDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePaymentInput) => paymentsApi.createPayment(data),
    onSuccess: () => {
      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });

      // Also invalidate related document queries as their status might have changed
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useBulkDeletePayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => paymentsApi.bulkDeletePayments(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
