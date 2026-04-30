import { apiFetch } from '@/lib/api';
import type { CreatePaymentInput } from '@shared/contracts/payments.contract';

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

export const paymentsApi = {
  getPayments: () => apiFetch<PaymentResponse[]>('/payments'),
  getPayment: (id: string) => apiFetch<PaymentResponse>(`/payments/${id}`),
  createPayment: (data: CreatePaymentInput) =>
    apiFetch<PaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePayment: (id: string) =>
    apiFetch<void>(`/payments/${id}`, {
      method: 'DELETE',
    }),
  bulkDeletePayments: (ids: string[]) =>
    apiFetch<void>('/payments', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
