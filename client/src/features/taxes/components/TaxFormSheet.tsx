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

import { createTaxSchema, type CreateTaxInput } from '@shared/contracts/taxes.contract';
import type { TaxResponse } from '../api/taxes.api';
import { useCreateTax, useUpdateTax } from '../hooks/taxes.hooks';

interface TaxFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tax?: TaxResponse;
}

export function TaxFormSheet({ isOpen, onClose, tax }: TaxFormSheetProps) {
  const isEdit = !!tax;
  const { mutateAsync: createTax, status: createStatus } = useCreateTax();
  const { mutateAsync: updateTax, status: updateStatus } = useUpdateTax();

  const form = useForm<CreateTaxInput>({
    resolver: zodResolver(createTaxSchema),
    defaultValues: {
      name: '',
      rate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (tax) {
      form.reset({
        name: tax.name,
        rate: tax.rate,
        description: tax.description || '',
      });
    } else {
      form.reset({
        name: '',
        rate: '',
        description: '',
      });
    }
  }, [tax, form, isOpen]);

  const onSubmit = async (data: CreateTaxInput) => {
    try {
      if (isEdit && tax) {
        await updateTax({ id: tax.id, data });
        toast.success('Tax updated successfully');
      } else {
        await createTax(data);
        toast.success('Tax created successfully');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update tax' : 'Failed to create tax');
    }
  };

  const isLoading = createStatus === 'pending' || updateStatus === 'pending';

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-md">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>{isEdit ? 'Edit Tax' : 'Add Tax'}</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            {isEdit
              ? 'Modify the details of the existing tax.'
              : 'Create a new tax for your products and services.'}
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateTaxInput, typeof createTaxSchema>
          form={form}
          schema={createTaxSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-4 px-4 py-4 flex-1 overflow-y-auto">
                <FormField name="name" label="Name">
                  {({ field }) => <Input {...field} placeholder="e.g. VAT, GST, Sales Tax" />}
                </FormField>

                <FormField name="rate" label="Rate (%)">
                  {({ field }) => <Input {...field} type="text" placeholder="e.g. 15" />}
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
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  {isEdit ? 'Update Tax' : 'Create Tax'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
