import { apiFetch } from '@/lib/api';
import type {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '@shared/contracts/invoices.contract';

export interface InvoiceLineResponse {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  taxRateAtOrder: string;
  taxAmount: string;
  lineTotal: string;
  product: {
    id: string;
    sku: string;
    name: string;
  };
}

export interface InvoiceResponse {
  id: string;
  customerId: string;
  salesOrderId: string | null;
  documentNumber: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  taxAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
  };
  salesOrder: {
    id: string;
    documentNumber: string;
  } | null;
  lines: InvoiceLineResponse[];
}

export const invoicesApi = {
  fetchInvoices: () => apiFetch<InvoiceResponse[]>('/invoices'),
  fetchInvoice: (id: string) => apiFetch<InvoiceResponse>(`/invoices/${id}`),
  createInvoice: (data: CreateInvoiceInput) =>
    apiFetch<InvoiceResponse>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createFromSalesOrder: (soId: string) =>
    apiFetch<InvoiceResponse>(`/invoices/from-so/${soId}`, {
      method: 'POST',
    }),
  updateInvoiceStatus: (id: string, data: UpdateInvoiceStatusInput) =>
    apiFetch<InvoiceResponse>(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
