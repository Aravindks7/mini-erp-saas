import { apiFetch } from '@/lib/api';
import type { CreateProductInput, UpdateProductInput } from '@shared/contracts/products.contract';

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  basePrice: string;
  baseUomId: string;
  taxId?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  baseUom: {
    id: string;
    code: string;
    name: string;
  };
  tax?: {
    id: string;
    name: string;
    rate: string;
  } | null;
}

export const productsApi = {
  fetchProducts: () => apiFetch<ProductResponse[]>('/products'),
  fetchProduct: (id: string) => apiFetch<ProductResponse>(`/products/${id}`),
  createProduct: (data: CreateProductInput) =>
    apiFetch<ProductResponse>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: UpdateProductInput) =>
    apiFetch<ProductResponse>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    apiFetch<{ message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteProducts: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/products/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
