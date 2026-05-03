import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '@shared/contracts/product-categories.contract';
import { productCategoriesApi } from '../api/product-categories.api';

export const productCategoryKeys = {
  all: ['product-categories'] as const,
  lists: () => [...productCategoryKeys.all, 'list'] as const,
  list: (filters?: string) => [...productCategoryKeys.lists(), { filters }] as const,
  details: () => [...productCategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productCategoryKeys.details(), id] as const,
};

export const productCategoryDetailQuery = (id: string) =>
  queryOptions({
    queryKey: productCategoryKeys.detail(id),
    queryFn: () => productCategoriesApi.getCategory(id),
  });

export function useProductCategories() {
  return useQuery({
    queryKey: productCategoryKeys.lists(),
    queryFn: productCategoriesApi.listCategories,
    staleTime: 5000,
  });
}

export function useProductCategory(id: string | undefined) {
  return useQuery({
    ...productCategoryDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductCategoryInput) => productCategoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductCategoryInput }) =>
      productCategoriesApi.updateCategory(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.detail(data.id) });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productCategoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.lists() });
    },
  });
}
