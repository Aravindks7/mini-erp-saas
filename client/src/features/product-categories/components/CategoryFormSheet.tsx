import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerDescription,
  ResponsiveDrawerHeader,
  ResponsiveDrawerTitle,
  ResponsiveDrawerFooter,
} from '@/components/shared/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';

import {
  createProductCategorySchema,
  type CreateProductCategoryInput,
} from '@shared/contracts/product-categories.contract';
import type { ProductCategoryResponse } from '../api/product-categories.api';
import {
  useCreateProductCategory,
  useUpdateProductCategory,
  useProductCategories,
} from '../hooks/product-categories.hooks';

interface CategoryFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ProductCategoryResponse;
}

export function CategoryFormSheet({ isOpen, onClose, category }: CategoryFormSheetProps) {
  const isEdit = !!category;
  const { data: categories = [] } = useProductCategories();
  const { mutateAsync: createCategory, status: createStatus } = useCreateProductCategory();
  const { mutateAsync: updateCategory, status: updateStatus } = useUpdateProductCategory();

  const form = useForm<CreateProductCategoryInput>({
    resolver: zodResolver(createProductCategorySchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      parentId: null,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        code: category.code,
        description: category.description || '',
        parentId: category.parentId || null,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        description: '',
        parentId: null,
      });
    }
  }, [category, form, isOpen]);

  const onSubmit = async (data: CreateProductCategoryInput) => {
    try {
      if (isEdit && category) {
        await updateCategory({ id: category.id, data: { ...data, id: category.id } });
        toast.success(`Category ${data.name} updated successfully`);
      } else {
        await createCategory(data);
        toast.success(`Category ${data.name} created successfully`);
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update category' : 'Failed to create category');
    }
  };

  const isLoading = createStatus === 'pending' || updateStatus === 'pending';

  // Filter out the current category to prevent circular references
  const parentOptions = categories
    .filter((c) => c.id !== category?.id)
    .map((c) => ({
      label: `${c.name} (${c.code})`,
      value: c.id,
    }));

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-md">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>{isEdit ? 'Edit Category' : 'Add Category'}</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            {isEdit
              ? 'Modify the details of the existing product category.'
              : 'Create a new category to organize your products.'}
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateProductCategoryInput, typeof createProductCategorySchema>
          form={form}
          schema={createProductCategorySchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-4 px-4 py-4 flex-1 overflow-y-auto">
                <FormField name="name" label="Category Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Electronics" />}
                </FormField>

                <FormField name="code" label="Category Code">
                  {({ field }) => <Input {...field} placeholder="e.g. ELEC" />}
                </FormField>

                <FormField name="parentId" label="Parent Category">
                  {({ field }) => (
                    <SearchableSelect
                      options={parentOptions}
                      value={field.value || undefined}
                      onChange={field.onChange}
                      placeholder="Select a parent category (Optional)"
                    />
                  )}
                </FormField>

                <FormField name="description" label="Description (Optional)">
                  {({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Provide a brief description of this category."
                      className="resize-none min-h-[100px]"
                    />
                  )}
                </FormField>
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  {isEdit ? 'Update Category' : 'Create Category'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
