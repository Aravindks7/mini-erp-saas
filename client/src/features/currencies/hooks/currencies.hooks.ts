import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateCurrencyInput,
  UpdateCurrencyInput,
} from '@shared/contracts/currencies.contract';
import { currenciesApi } from '../api/currencies.api';

import { useTenant } from '@/contexts/TenantContext';

export const currencyKeys = {
  all: (orgId?: string | null) => ['currencies', orgId].filter(Boolean) as string[],
  lists: (orgId?: string | null) => [...currencyKeys.all(orgId), 'list'] as const,
  details: (orgId?: string | null) => [...currencyKeys.all(orgId), 'detail'] as const,
  detail: (orgId: string | null, id: string) => [...currencyKeys.details(orgId), id] as const,
};

export const currencyDetailQuery = (orgId: string | null, id: string) =>
  queryOptions({
    queryKey: currencyKeys.detail(orgId, id),
    queryFn: () => currenciesApi.fetchCurrency(id),
  });

export const currencyListQuery = (orgId?: string | null) =>
  queryOptions({
    queryKey: currencyKeys.lists(orgId),
    queryFn: currenciesApi.fetchCurrencies,
    enabled: !!orgId,
    staleTime: 60000, // Currencies change rarely
  });

export function useCurrencies() {
  const { activeOrganizationId } = useTenant();
  return useQuery(currencyListQuery(activeOrganizationId));
}

export function useCurrency(id: string | undefined) {
  const { activeOrganizationId } = useTenant();
  return useQuery({
    ...currencyDetailQuery(activeOrganizationId, id || ''),
    enabled: !!id && !!activeOrganizationId,
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreateCurrencyInput) => currenciesApi.createCurrency(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists(activeOrganizationId) });
    },
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCurrencyInput }) =>
      currenciesApi.updateCurrency(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists(activeOrganizationId) });
      queryClient.invalidateQueries({
        queryKey: currencyKeys.detail(activeOrganizationId, data.id),
      });
    },
  });
}

export function useDeleteCurrency() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => currenciesApi.deleteCurrency(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: currencyKeys.lists(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
