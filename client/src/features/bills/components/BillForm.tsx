import type { UseFormReturn } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { ReceiptText, Plus, Trash2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { useSuppliers } from '@/features/suppliers/hooks/suppliers.hooks';
import { useProducts } from '@/features/products/hooks/products.hooks';

import type { CreateBillInput } from '@shared/contracts/bills.contract';
import { createBillSchema } from '@shared/contracts/bills.contract';

interface BillFormProps {
  form: UseFormReturn<CreateBillInput, unknown>;
  onSubmit: (data: CreateBillInput) => Promise<void>;
  formId?: string;
  isEdit?: boolean;
}

export function BillForm({ form, onSubmit, formId, isEdit = false }: BillFormProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliers();
  const { data: products, isLoading: isLoadingProducts } = useProducts();

  const supplierOptions = (suppliers || []).map((s) => ({
    label: s.name,
    value: s.id,
  }));

  const productOptions = (products || []).map((p) => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <Form<CreateBillInput, typeof createBillSchema>
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
                <ReceiptText className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Bill Information</CardTitle>
              </div>
              <CardDescription>Primary details for the vendor bill.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="referenceNumber" label="Reference Number">
                  {({ field }) => <Input {...field} placeholder="INV-2026-001" />}
                </FormField>

                <FormField name="supplierId" label="Supplier">
                  {({ field }) => (
                    <SearchableSelect
                      options={supplierOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={isLoadingSuppliers ? 'Loading suppliers...' : 'Select supplier'}
                      disabled={isLoadingSuppliers}
                    />
                  )}
                </FormField>

                <FormField name="issueDate" label="Issue Date">
                  {({ field }) => (
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : String(field.value || '')
                      }
                    />
                  )}
                </FormField>

                <FormField name="dueDate" label="Due Date">
                  {({ field }) => (
                    <Input
                      type="date"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : String(field.value || '')
                      }
                    />
                  )}
                </FormField>
              </div>

              <FormField name="notes" label="Notes">
                {({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder="Additional details..."
                  />
                )}
              </FormField>

              {isEdit && (
                <FormField name="status" label="Status">
                  {({ field }) => (
                    <Tabs
                      onValueChange={field.onChange}
                      value={field.value || 'draft'}
                      className="w-full sm:w-[300px]"
                    >
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="draft">Draft</TabsTrigger>
                        <TabsTrigger value="open">Open</TabsTrigger>
                        <TabsTrigger value="paid">Paid</TabsTrigger>
                        <TabsTrigger value="void">Void</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </FormField>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20">
            <CardHeader className="bg-muted/30 py-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Line Items</CardTitle>
                <CardDescription>Products and services billed.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    productId: '',
                    quantity: '1',
                    unitPrice: '0',
                    taxRateAtOrder: '0',
                    taxAmount: '0',
                    lineTotal: '0',
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Line
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-4 p-4 border rounded-md relative"
                >
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1">
                    <FormField
                      name={`lines.${index}.productId`}
                      label="Product"
                      className="md:col-span-2"
                    >
                      {({ field: inputField }) => (
                        <SearchableSelect
                          options={productOptions}
                          value={inputField.value}
                          onChange={inputField.onChange}
                          placeholder={isLoadingProducts ? 'Loading products...' : 'Select product'}
                          disabled={isLoadingProducts}
                        />
                      )}
                    </FormField>
                    <FormField name={`lines.${index}.quantity`} label="Qty">
                      {({ field: inputField }) => <Input type="number" {...inputField} />}
                    </FormField>
                    <FormField name={`lines.${index}.unitPrice`} label="Price">
                      {({ field: inputField }) => (
                        <Input type="number" step="0.01" {...inputField} />
                      )}
                    </FormField>
                    <FormField name={`lines.${index}.taxRateAtOrder`} label="Tax %">
                      {({ field: inputField }) => (
                        <Input type="number" step="0.01" {...inputField} />
                      )}
                    </FormField>
                    <FormField name={`lines.${index}.lineTotal`} label="Total">
                      {({ field: inputField }) => (
                        <Input type="number" step="0.01" {...inputField} />
                      )}
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive mt-8"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && (
                <div className="text-center p-8 text-muted-foreground border border-dashed rounded-md">
                  No line items. Add one to continue.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Form>
  );
}
