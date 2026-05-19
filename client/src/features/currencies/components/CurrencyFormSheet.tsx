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
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';

import {
  createCurrencySchema,
  type CreateCurrencyInput,
  type CurrencyResponse,
} from '@shared/contracts/currencies.contract';
import { useCreateCurrency, useUpdateCurrency } from '../hooks/currencies.hooks';

interface CurrencyFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: CurrencyResponse;
}

export function CurrencyFormSheet({ isOpen, onClose, currency }: CurrencyFormSheetProps) {
  const isEdit = !!currency;
  const { mutateAsync: createCurrency, status: createStatus } = useCreateCurrency();
  const { mutateAsync: updateCurrency, status: updateStatus } = useUpdateCurrency();

  const form = useForm<CreateCurrencyInput>({
    resolver: zodResolver(createCurrencySchema) as Resolver<CreateCurrencyInput>,
    defaultValues: {
      code: '',
      name: '',
      symbol: '',
      isActive: true,
      isDefault: false,
    },
  });

  useEffect(() => {
    if (currency) {
      form.reset({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        isActive: currency.isActive,
        isDefault: currency.isDefault,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        symbol: '',
        isActive: true,
        isDefault: false,
      });
    }
  }, [currency, form, isOpen]);

  const onSubmit = async (data: CreateCurrencyInput) => {
    try {
      if (isEdit && currency) {
        await updateCurrency({ id: currency.id, data });
        toast.success('Currency updated successfully');
      } else {
        await createCurrency(data);
        toast.success('Currency created successfully');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update Currency' : 'Failed to create Currency');
    }
  };

  const isLoading = createStatus === 'pending' || updateStatus === 'pending';

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-md">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>{isEdit ? 'Edit Currency' : 'Add Currency'}</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            {isEdit
              ? 'Modify the details of the existing currency.'
              : 'Create a new currency for your organization.'}
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateCurrencyInput, typeof createCurrencySchema>
          form={form}
          schema={createCurrencySchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-4 px-4 py-4 flex-1 overflow-y-auto">
                <FormField name="code" label="ISO Code">
                  {({ field }) => (
                    <Input {...field} placeholder="e.g. USD, EUR, GBP" className="uppercase" />
                  )}
                </FormField>

                <FormField name="name" label="Name">
                  {({ field }) => <Input {...field} placeholder="e.g. US Dollar, Euro" />}
                </FormField>

                <FormField name="symbol" label="Symbol">
                  {({ field }) => <Input {...field} placeholder="e.g. $, €, £" />}
                </FormField>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField name="isActive" label="Active">
                    {({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isActive"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="isActive"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Available for use
                        </label>
                      </div>
                    )}
                  </FormField>

                  <FormField name="isDefault" label="Default">
                    {({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isDefault"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="isDefault"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          System default
                        </label>
                      </div>
                    )}
                  </FormField>
                </div>
              </div>

              <ResponsiveDrawerFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" loading={isLoading}>
                  {isEdit ? 'Update Currency' : 'Create Currency'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
