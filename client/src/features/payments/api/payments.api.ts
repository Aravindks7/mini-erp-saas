import { apiFetch } from '@/lib/api';
import type { CreatePaymentInput } from '@shared/contracts/payments.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface PaymentResponse {
  id: string;
  organizationId: string;
  paymentType: 'inbound' | 'outbound';
  paymentMethod: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: string;
  paymentDate: string;
  referenceNumber?: string | null;
  notes?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  invoiceId?: string | null;
  billId?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  customer?: { id: string; companyName: string } | null;
  supplier?: { id: string; companyName: string } | null;
  invoice?: { id: string; documentNumber: string } | null;
  bill?: { id: string; documentNumber: string } | null;
}

export interface PaymentIntentResponse {
  id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'expired';
  provider: string;
  providerRef: string;
  createdAt: string;
}

export const paymentsApi = {
  getPayments: () => apiFetch<PaymentResponse[]>(API_ENDPOINTS.finance.payments.base),
  getPayment: (id: string) => apiFetch<PaymentResponse>(API_ENDPOINTS.finance.payments.detail(id)),
  getPaymentIntents: (filters: { invoiceId?: string; billId?: string }) => {
    const params = new URLSearchParams();
    if (filters.invoiceId) params.append('invoiceId', filters.invoiceId);
    if (filters.billId) params.append('billId', filters.billId);
    return apiFetch<PaymentIntentResponse[]>(
      `${API_ENDPOINTS.finance.payments.intents}?${params.toString()}`,
    );
  },
  createPayment: (data: CreatePaymentInput) =>
    apiFetch<PaymentResponse>(API_ENDPOINTS.finance.payments.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createStripeSession: (data: {
    invoiceId: string;
    amount: string;
    successUrl: string;
    cancelUrl: string;
  }) =>
    apiFetch<{ url: string }>(API_ENDPOINTS.finance.payments.createStripeSession, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePayment: (id: string) =>
    apiFetch<void>(API_ENDPOINTS.finance.payments.detail(id), {
      method: 'DELETE',
    }),
  bulkDeletePayments: (ids: string[]) =>
    apiFetch<void>(API_ENDPOINTS.finance.payments.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
