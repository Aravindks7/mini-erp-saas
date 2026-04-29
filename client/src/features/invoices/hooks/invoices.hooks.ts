import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '@shared/contracts/invoices.contract';
import { invoicesApi } from '../api/invoices.api';

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

export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: invoicesApi.fetchInvoices,
    staleTime: 5000,
  });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceStatusInput }) =>
      invoicesApi.updateInvoiceStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
    },
  });
}
