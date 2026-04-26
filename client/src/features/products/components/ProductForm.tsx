import type { UseFormReturn } from 'react-hook-form';
import { Package } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { CreateProductInput } from '@shared/contracts/products.contract';
import { createProductSchema } from '@shared/contracts/products.contract';
import { useUoms } from '@/features/uom/hooks/uoms.hooks';
import { useTaxes } from '@/features/taxes/hooks/taxes.hooks';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';

interface ProductFormProps {
  form: UseFormReturn<CreateProductInput, unknown>;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  formId?: string;
  isEdit?: boolean;
}

export function ProductForm({ form, onSubmit, formId, isEdit = false }: ProductFormProps) {
  const { data: uoms = [] } = useUoms();
  const { data: taxes = [] } = useTaxes();

  const uomOptions = uoms.map((uom) => ({
    label: uom.name,
    value: uom.id,
  }));

  const taxOptions = taxes.map((tax) => ({
    label: `${tax.name} (${tax.rate}%)`,
    value: tax.id,
  }));

  return (
    <Form<CreateProductInput, typeof createProductSchema>
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
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Global Information</CardTitle>
              </div>
              <CardDescription>Basic details about the product.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="sku" label="SKU">
                  {({ field }) => <Input {...field} placeholder="e.g. PROD-001" />}
                </FormField>

                <FormField name="name" label="Product Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Widget A" />}
                </FormField>
              </div>

              <FormField name="description" label="Description (Optional)">
                {({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Provide a detailed description of the product..."
                    className="min-h-[100px]"
                  />
                )}
              </FormField>

              <div className="grid gap-6 sm:grid-cols-3">
                <FormField name="basePrice" label="Base Price">
                  {({ field }) => <Input {...field} type="number" step="0.01" placeholder="0.00" />}
                </FormField>

                <FormField name="baseUomId" label="Base UoM">
                  {({ field }) => (
                    <SearchableSelect
                      options={uomOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select UoM..."
                    />
                  )}
                </FormField>

                <FormField name="taxId" label="Tax (Optional)">
                  {({ field }) => (
                    <SearchableSelect
                      options={taxOptions}
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      placeholder="Select Tax..."
                    />
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
        </div>
      )}
    </Form>
  );
}
