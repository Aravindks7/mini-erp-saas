import type { UseFormReturn } from 'react-hook-form';
import { Building, Info } from 'lucide-react';

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

interface CustomerFormProps {
  form: UseFormReturn<CreateCustomerInput, unknown>;
  onSubmit: (data: CreateCustomerInput) => Promise<void>;
  formId?: string;
}

export function CustomerForm({ form, onSubmit, formId }: CustomerFormProps) {
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
            <CardHeader className="bg-muted/30 pb-4">
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

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="status" label="Status">
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
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Domain Details
              </h3>
            </div>
            <AddressSection control={form.control} name="addresses" />
            <ContactSection control={form.control} name="contacts" />
          </div>
        </div>
      )}
    </Form>
  );
}
