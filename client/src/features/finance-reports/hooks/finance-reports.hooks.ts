import { useQuery, queryOptions } from '@tanstack/react-query';
import { financeReportsApi } from '../api/finance-reports.api';

export const financeReportsKeys = {
  all: ['finance-reports'] as const,
  pnl: (params: { startDate: string; endDate: string }) =>
    [...financeReportsKeys.all, 'pnl', params] as const,
  balanceSheet: (params: { endDate: string }) =>
    [...financeReportsKeys.all, 'balance-sheet', params] as const,
};

export const profitAndLossQuery = (params: { startDate: string; endDate: string }) =>
  queryOptions({
    queryKey: financeReportsKeys.pnl(params),
    queryFn: () => financeReportsApi.getProfitAndLoss(params),
    staleTime: 60000,
  });

export const balanceSheetQuery = (params: { endDate: string }) =>
  queryOptions({
    queryKey: financeReportsKeys.balanceSheet(params),
    queryFn: () => financeReportsApi.getBalanceSheet(params),
    staleTime: 60000,
  });

export function useProfitAndLoss(params: { startDate: string; endDate: string }) {
  return useQuery(profitAndLossQuery(params));
}

export function useBalanceSheet(params: { endDate: string }) {
  return useQuery(balanceSheetQuery(params));
}
