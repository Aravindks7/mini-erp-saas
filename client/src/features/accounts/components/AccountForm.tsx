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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { createAccountSchema, type CreateAccountInput } from '@shared/contracts/finance.contract';
import type { AccountResponse } from '../api/accounts.api';
import { useCreateAccount, useUpdateAccount } from '../hooks/accounts.hooks';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: AccountResponse;
}

export function AccountForm({ isOpen, onClose, account }: AccountFormProps) {
  const isEdit = !!account;
  const { mutateAsync: createAccount, status: createStatus } = useCreateAccount();
  const { mutateAsync: updateAccount, status: updateStatus } = useUpdateAccount();

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'asset',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        code: account.code,
        name: account.name,
        type: account.type,
        description: account.description || '',
        isActive: account.isActive,
      });
    } else {
      form.reset({
        code: '',
        name: '',
        type: 'asset',
        description: '',
        isActive: true,
      });
    }
  }, [account, form, isOpen]);

  const onSubmit = async (data: CreateAccountInput) => {
    try {
      if (isEdit && account) {
        await updateAccount({ id: account.id, data });
        toast.success('Account updated successfully');
      } else {
        await createAccount(data);
        toast.success('Account created successfully');
      }
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save account';
      toast.error(message);
    }
  };

  const isLoading = createStatus === 'pending' || updateStatus === 'pending';

  return (
    <ResponsiveDrawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ResponsiveDrawerContent className="sm:max-w-md">
        <ResponsiveDrawerHeader>
          <ResponsiveDrawerTitle>{isEdit ? 'Edit Account' : 'Add Account'}</ResponsiveDrawerTitle>
          <ResponsiveDrawerDescription>
            {isEdit
              ? 'Modify the details of the existing account in your CoA.'
              : 'Add a new account to your Chart of Accounts.'}
          </ResponsiveDrawerDescription>
        </ResponsiveDrawerHeader>

        <Form<CreateAccountInput, typeof createAccountSchema>
          form={form}
          schema={createAccountSchema}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {() => (
            <>
              <div className="space-y-4 px-4 py-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FormField name="code" label="Account Code">
                    {({ field }) => <Input {...field} placeholder="e.g. 1000" />}
                  </FormField>

                  <FormField name="type" label="Account Type">
                    {({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="liability">Liability</SelectItem>
                          <SelectItem value="equity">Equity</SelectItem>
                          <SelectItem value="revenue">Revenue</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormField>
                </div>

                <FormField name="name" label="Account Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Main Checking" />}
                </FormField>

                <FormField name="description" label="Description (Optional)">
                  {({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Briefly describe the purpose of this account..."
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
                  {isEdit ? 'Update Account' : 'Create Account'}
                </Button>
              </ResponsiveDrawerFooter>
            </>
          )}
        </Form>
      </ResponsiveDrawerContent>
    </ResponsiveDrawer>
  );
}
