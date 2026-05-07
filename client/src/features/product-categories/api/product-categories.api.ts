import { apiFetch } from '@/lib/api';
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '@shared/contracts/product-categories.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  listCategories: () =>
    apiFetch<ProductCategoryResponse[]>(API_ENDPOINTS.setup.productCategories.base),
  getCategory: (id: string) =>
    apiFetch<ProductCategoryResponse>(API_ENDPOINTS.setup.productCategories.detail(id)),
  createCategory: (data: CreateProductCategoryInput) =>
    apiFetch<ProductCategoryResponse>(API_ENDPOINTS.setup.productCategories.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: UpdateProductCategoryInput) =>
    apiFetch<ProductCategoryResponse>(API_ENDPOINTS.setup.productCategories.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.setup.productCategories.detail(id), {
      method: 'DELETE',
    }),
};
