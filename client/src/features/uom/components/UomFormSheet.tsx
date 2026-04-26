import { useForm, type Resolver } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';

import { createUomSchema, type CreateUomInput } from '@shared/contracts/uom.contract';
import type { UomResponse } from '../api/uoms.api';
import { useCreateUom, useUpdateUom } from '../hooks/uoms.hooks';

interface UomFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  uom?: UomResponse;
}

export function UomFormSheet({ isOpen, onClose, uom }: UomFormSheetProps) {
  const isEdit = !!uom;
  const { mutateAsync: createUom, status: createStatus } = useCreateUom();
  const { mutateAsync: updateUom, status: updateStatus } = useUpdateUom();

  const form = useForm<CreateUomInput>({
    resolver: zodResolver(createUomSchema) as Resolver<CreateUomInput>,
    defaultValues: {
      code: '',
      name: '',
      description: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (uom) {
      form.reset({
        code: uom.code,
        name: uom.name,
        description: uom.description || '',
        isDefault: uom.isDefault,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        isDefault: false,
      });
    }
  }, [uom, form, isOpen]);

  const onSubmit = async (data: CreateUomInput) => {
    try {
      if (isEdit && uom) {
        await updateUom({ id: uom.id, data });
        toast.success('Unit of Measure updated successfully');
      } else {
        await createUom(data);
        toast.success('Unit of Measure created successfully');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update Unit of Measure' : 'Failed to create Unit of Measure');
    }
  };

  const isLoading = createStatus === 'pending' || updateStatus === 'pending';

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-md">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>
            {isEdit ? 'Edit Unit of Measure' : 'Add Unit of Measure'}
          </ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            {isEdit
              ? 'Modify the details of the existing unit of measure.'
              : 'Create a new unit of measure for your products.'}
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateUomInput, typeof createUomSchema>
          form={form}
          schema={createUomSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-4 px-4 py-4 flex-1 overflow-y-auto">
                <FormField name="code" label="Code">
                  {({ field }) => <Input {...field} placeholder="e.g. PCS, KG, L" />}
                </FormField>

                <FormField name="name" label="Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Pieces, Kilograms, Liters" />}
                </FormField>

                <FormField name="description" label="Description (Optional)">
                  {({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Enter a brief description..."
                      className="resize-none"
                    />
                  )}
                </FormField>

                <FormField name="isDefault" label="Set as Default">
                  {({ field }) => (
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="isDefault"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <label
                        htmlFor="isDefault"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Use this as the default unit of measure
                      </label>
                    </div>
                  )}
                </FormField>
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  {isEdit ? 'Update UoM' : 'Create UoM'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
