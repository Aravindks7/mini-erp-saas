import { apiFetch } from '@/lib/api';
import type {
  CreateInvoiceInput,
  UpdateInvoiceStatusInput,
} from '@shared/contracts/invoices.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  status: 'draft' | 'open' | 'partially_paid' | 'paid' | 'void';
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  balanceDue: string;
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
  fetchInvoices: () => apiFetch<InvoiceResponse[]>(API_ENDPOINTS.sales.invoices.base),
  fetchInvoice: (id: string) => apiFetch<InvoiceResponse>(API_ENDPOINTS.sales.invoices.detail(id)),
  createInvoice: (data: CreateInvoiceInput) =>
    apiFetch<InvoiceResponse>(API_ENDPOINTS.sales.invoices.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createFromSalesOrder: (soId: string) =>
    apiFetch<InvoiceResponse>(API_ENDPOINTS.sales.invoices.fromOrder(soId), {
      method: 'POST',
    }),
  updateInvoiceStatus: (id: string, data: UpdateInvoiceStatusInput) =>
    apiFetch<InvoiceResponse>(API_ENDPOINTS.sales.invoices.status(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteInvoice: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.sales.invoices.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteInvoices: (ids: string[]) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.sales.invoices.bulkDelete, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
