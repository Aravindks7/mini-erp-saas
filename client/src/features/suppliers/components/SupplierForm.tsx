import type { UseFormReturn } from 'react-hook-form';
import { Truck } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddressSection } from '@/components/shared/domain/AddressSection';
import { ContactSection } from '@/components/shared/domain/ContactSection';

import type { CreateSupplierInput } from '@shared/contracts/suppliers.contract';
import { createSupplierSchema } from '@shared/contracts/suppliers.contract';

interface SupplierFormProps {
  form: UseFormReturn<CreateSupplierInput, unknown>;
  onSubmit: (data: CreateSupplierInput) => Promise<void>;
  formId?: string;
  isEdit?: boolean;
}

export function SupplierForm({ form, onSubmit, formId, isEdit = false }: SupplierFormProps) {
  return (
    <Form<CreateSupplierInput, typeof createSupplierSchema>
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
                <Truck className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Global Information</CardTitle>
              </div>
              <CardDescription>Basic details about the supplier company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="name" label="Supplier Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Acme Logistics" />}
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
