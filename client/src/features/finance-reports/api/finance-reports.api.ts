import { apiFetch } from '@/lib/api';
import type {
  ProfitAndLossResponse,
  BalanceSheetResponse,
} from '@shared/contracts/finance.contract';

export const financeReportsApi = {
  getProfitAndLoss: async (params: { startDate: string; endDate: string }) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiFetch<ProfitAndLossResponse>(`/finance/reports/profit-and-loss?${queryParams}`);
  },

  getBalanceSheet: async (params: { endDate: string }) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiFetch<BalanceSheetResponse>(`/finance/reports/balance-sheet?${queryParams}`);
  },
};
