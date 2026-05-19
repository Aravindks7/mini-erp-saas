import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CreatePaymentInput } from '@shared/contracts/payments.contract';
import { paymentsApi } from '../api/payments.api';
import { activityKeys } from '../../activity/hooks/activity.hooks';

import { invoiceKeys } from '../../invoices/hooks/invoices.hooks';
import { billKeys } from '../../bills/hooks/bills.hooks';
import { customerKeys } from '../../customers/hooks/customers.hooks';
import { supplierKeys } from '../../suppliers/hooks/suppliers.hooks';
import { salesOrderKeys } from '../../sales-orders/hooks/sales-orders.hooks';
import { purchaseOrderKeys } from '../../purchase-orders/hooks/purchase-orders.hooks';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  intents: (filters: { invoiceId?: string; billId?: string }) =>
    [...paymentKeys.all, 'intents', filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

export const paymentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsApi.getPayment(id),
  });

export const paymentListQuery = () =>
  queryOptions({
    queryKey: paymentKeys.lists(),
    queryFn: paymentsApi.getPayments,
  });

export const paymentIntentsQuery = (filters: { invoiceId?: string; billId?: string }) =>
  queryOptions({
    queryKey: paymentKeys.intents(filters),
    queryFn: () => paymentsApi.getPaymentIntents(filters),
  });

export function usePaymentsQuery() {
  return useQuery(paymentListQuery());
}

export function usePaymentsActions() {
  const queryClient = useQueryClient();

  return {
    invalidatePayments: () => queryClient.invalidateQueries({ queryKey: paymentKeys.lists() }),
  };
}

export function usePaymentIntentsQuery(filters: { invoiceId?: string; billId?: string }) {
  return useQuery(paymentIntentsQuery(filters));
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
    onSuccess: (data) => {
      // Update cache for the new payment
      queryClient.setQueryData(paymentKeys.detail(data.id), data);

      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });

      // Also invalidate related document queries as their status might have changed
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useCreateStripeSession() {
  return useMutation({
    mutationFn: paymentsApi.createStripeSession,
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useBulkDeletePayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => paymentsApi.bulkDeletePayments(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: billKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
