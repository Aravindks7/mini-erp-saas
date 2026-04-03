import { useNavigate } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { AddressSection } from '@/components/shared/domain/AddressSection';
import { ContactSection } from '@/components/shared/domain/ContactSection';

import type { CreateCustomerInput } from '@shared/contracts/customers.contract';
import { createCustomerSchema } from '@shared/contracts/customers.contract';
import type { CustomerResponse } from '../api/customers';

interface CustomerFormProps {
  initialData?: CustomerResponse;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  isSubmitting: boolean;
}

export function CustomerForm({ initialData, onSubmit, isSubmitting }: CustomerFormProps) {
  const navigate = useNavigate();

  const defaultValues: Partial<CreateCustomerInput> = initialData || {
    companyName: '',
    status: 'active',
    taxNumber: '',
    addresses: [],
    contacts: [],
  };

  return (
    <Form<CreateCustomerInput, typeof createCustomerSchema>
      schema={createCustomerSchema}
      defaultValues={defaultValues as any}
      onSubmit={onSubmit}
    >
      {(form) => (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Global Information</CardTitle>
              <CardDescription>Basic details about the customer company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="companyName" label="Company Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Acme Corp" />}
                </FormField>

                <FormField name="taxNumber" label="Tax Number (Optional)">
                  {({ field }) => (
                    <Input {...field} value={field.value ?? ''} placeholder="VAT ID, EIN, etc." />
                  )}
                </FormField>
              </div>

              <FormField name="status" label="Status" className="sm:max-w-[240px]">
                {({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </CardContent>
          </Card>

          <AddressSection control={form.control} name="addresses" />

          <ContactSection control={form.control} name="contacts" />

          <div className="flex items-center justify-end space-x-4 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t z-10 -mx-6 px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customers')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px] shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Customer
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
