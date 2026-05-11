import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '@shared/contracts/invoices.contract';
import { invoicesApi } from '../api/invoices.api';
import { salesOrderKeys } from '../../sales-orders/hooks/sales-orders.hooks';
import { activityKeys } from '../../activity/hooks/activity.hooks';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export const invoiceDetailQuery = (id: string) =>
  queryOptions({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoicesApi.fetchInvoice(id),
  });

export const invoiceListQuery = () =>
  queryOptions({
    queryKey: invoiceKeys.lists(),
    queryFn: invoicesApi.fetchInvoices,
    staleTime: 5000,
  });

export function useInvoicesQuery() {
  return useQuery(invoiceListQuery());
}

export function useInvoicesActions() {
  const queryClient = useQueryClient();

  return {
    invalidateInvoices: () => queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  };
}

export function useInvoice(id: string | undefined) {
  return useQuery({
    ...invoiceDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoicesApi.createInvoice(data),
    onSuccess: (data) => {
      queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useCreateInvoiceFromSO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (soId: string) => invoicesApi.createFromSalesOrder(soId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      // Also invalidate SO details if we show invoices on SO page
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: activityKeys.all, refetchType: 'all' });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceStatusInput }) =>
      invoicesApi.updateInvoiceStatus(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(invoiceKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Invoice processed successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process invoice');
    },
  });
}

export function useBulkDeleteInvoices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => invoicesApi.bulkDeleteInvoices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      toast.success('Invoices processed successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to process invoices');
    },
  });
}
