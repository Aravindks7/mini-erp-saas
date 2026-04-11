import type { UseFormReturn } from 'react-hook-form';
import { Building } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddressSection } from '@/components/shared/domain/AddressSection';
import { ContactSection } from '@/components/shared/domain/ContactSection';

import type { CreateCustomerInput } from '@shared/contracts/customers.contract';
import { createCustomerSchema } from '@shared/contracts/customers.contract';

interface CustomerFormProps {
  form: UseFormReturn<CreateCustomerInput, unknown>;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  formId?: string;
  isEdit?: boolean;
}

export function CustomerForm({ form, onSubmit, formId, isEdit = false }: CustomerFormProps) {
  return (
    <Form<CreateCustomerInput, typeof createCustomerSchema>
      form={form}
      onSubmit={onSubmit}
      id={formId}
      className="space-y-8"
    >
      {() => (
        <div className="space-y-8">
          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 py-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Global Information</CardTitle>
              </div>
              <CardDescription>Basic details about the customer company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
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

              {isEdit && (
                <FormField name="status" label="Status">
                  {({ field }) => (
                    <Tabs
                      onValueChange={field.onChange}
                      value={field.value || 'active'}
                      className="w-full sm:w-[150px]"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="inactive">Inactive</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </FormField>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <AddressSection control={form.control} name="addresses" />
            <ContactSection control={form.control} name="contacts" />
          </div>
        </div>
      )}
    </Form>
  );
}
