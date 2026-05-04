import { useQuery } from '@tanstack/react-query';
import { financeReportsApi } from '../api/finance-reports.api';

export const financeReportsKeys = {
  all: ['finance-reports'] as const,
  pnl: (params: { startDate: string; endDate: string }) =>
    [...financeReportsKeys.all, 'pnl', params] as const,
  balanceSheet: (params: { endDate: string }) =>
    [...financeReportsKeys.all, 'balance-sheet', params] as const,
};

export function useProfitAndLoss(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: financeReportsKeys.pnl(params),
    queryFn: () => financeReportsApi.getProfitAndLoss(params),
    staleTime: 60000, // Finance reports can be cached longer
  });
}

export function useBalanceSheet(params: { endDate: string }) {
  return useQuery({
    queryKey: financeReportsKeys.balanceSheet(params),
    queryFn: () => financeReportsApi.getBalanceSheet(params),
    staleTime: 60000,
  });
}
