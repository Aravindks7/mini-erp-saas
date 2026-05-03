import { apiFetch } from '@/lib/api';
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '@shared/contracts/product-categories.contract';

export interface ProductCategoryResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export const productCategoriesApi = {
  listCategories: () => apiFetch<ProductCategoryResponse[]>('/product-categories'),
  getCategory: (id: string) => apiFetch<ProductCategoryResponse>(`/product-categories/${id}`),
  createCategory: (data: CreateProductCategoryInput) =>
    apiFetch<ProductCategoryResponse>('/product-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: UpdateProductCategoryInput) =>
    apiFetch<ProductCategoryResponse>(`/product-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    apiFetch<{ message: string }>(`/product-categories/${id}`, {
      method: 'DELETE',
    }),
};
