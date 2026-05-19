import { apiFetch } from '@/lib/api';
import type { CreateProductInput, UpdateProductInput } from '@shared/contracts/products.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  basePrice: string;
  baseUomId: string;
  categoryId?: string | null;
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
  category?: {
    id: string;
    name: string;
  } | null;
  tax?: {
    id: string;
    name: string;
    rate: string;
  } | null;
}

export const productsApi = {
  fetchProducts: () => apiFetch<ProductResponse[]>(API_ENDPOINTS.products.base),
  fetchProduct: (id: string) => apiFetch<ProductResponse>(API_ENDPOINTS.products.detail(id)),
  createProduct: (data: CreateProductInput) =>
    apiFetch<ProductResponse>(API_ENDPOINTS.products.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: UpdateProductInput) =>
    apiFetch<ProductResponse>(API_ENDPOINTS.products.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.products.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteProducts: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>(
      API_ENDPOINTS.products.bulkDelete,
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      },
    ),
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{
      totalProcessed: number;
      successCount: number;
      failedCount: number;
      errors: Array<{ row: number; message: string }>;
      successfulRecords?: Array<unknown>;
    }>(API_ENDPOINTS.products.import, {
      method: 'POST',
      body: formData,
    });
  },
};
