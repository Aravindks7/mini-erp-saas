import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '@shared/contracts/product-categories.contract';
import { productCategoriesApi } from '../api/product-categories.api';
import { activityKeys } from '@/features/activity/hooks/activity.hooks';

export const categoryKeys = {
  all: ['product-categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: string) => [...categoryKeys.lists(), { filters }] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

export const productCategoryDetailQuery = (id: string) =>
  queryOptions({
    queryKey: categoryKeys.detail(id),
    queryFn: () => productCategoriesApi.getCategory(id),
  });

export const productCategoryListQuery = () =>
  queryOptions({
    queryKey: categoryKeys.lists(),
    queryFn: productCategoriesApi.listCategories,
    staleTime: 5000,
  });

export function useProductCategoriesQuery() {
  return useQuery(productCategoryListQuery());
}

export function useProductCategoriesActions() {
  const queryClient = useQueryClient();

  return {
    invalidateCategories: () => queryClient.invalidateQueries({ queryKey: categoryKeys.lists() }),
  };
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
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductCategoryInput }) =>
      productCategoriesApi.updateCategory(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.id) });
    },
  });
}

export function useDeleteProductCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productCategoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
