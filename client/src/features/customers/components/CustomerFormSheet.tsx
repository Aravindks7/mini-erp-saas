import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useEffect } from 'react';

import {
  ResponsiveDrawer,
  ResponsiveDrawerContent,
  ResponsiveDrawerDescription,
  ResponsiveDrawerHeader,
  ResponsiveDrawerTitle,
  ResponsiveDrawerFooter,
} from '@/components/shared/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { CustomerForm } from './CustomerForm';
import { useCreateCustomer } from '../hooks/customers.hooks';
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from '@shared/contracts/customers.contract';

interface CustomerFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customerId: string) => void;
}

export function CustomerFormSheet({ isOpen, onClose, onSuccess }: CustomerFormSheetProps) {
  const { mutateAsync: createCustomer, status } = useCreateCustomer();
  const isSubmitting = status === 'pending';

  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema) as Resolver<CreateCustomerInput>,
    defaultValues: {
      companyName: '',
      status: 'active',
      taxNumber: '',
      addresses: [],
      contacts: [],
    },
  });

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      form.reset({
        companyName: '',
        status: 'active',
        taxNumber: '',
        addresses: [],
        contacts: [],
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: CreateCustomerInput) => {
    try {
      const result = await createCustomer(data);
      toast.success(`Customer ${data.companyName} created successfully`);
      onSuccess?.(result.id);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      toast.error(message);
    }
  };

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-2xl">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>New Customer</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            Add a new customer to your organization.
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
          <CustomerForm form={form} onSubmit={onSubmit} formId="quick-customer-form" />
        </div>

        <ResponsiveDrawerFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="quick-customer-form" loading={isSubmitting}>
            Create Customer
          </Button>
        </ResponsiveDrawerFooter>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
