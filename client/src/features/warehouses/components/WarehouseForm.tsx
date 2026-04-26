import type { UseFormReturn } from 'react-hook-form';
import { Warehouse } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { AddressSection } from '@/components/shared/domain/AddressSection';
import { BinSection } from './BinSection';

import type { CreateWarehouseInput } from '@shared/contracts/warehouses.contract';
import { createWarehouseSchema } from '@shared/contracts/warehouses.contract';

interface WarehouseFormProps {
  form: UseFormReturn<CreateWarehouseInput, unknown>;
  onSubmit: (data: CreateWarehouseInput) => Promise<void>;
  formId?: string;
  isEdit?: boolean;
}

export function WarehouseForm({ form, onSubmit, formId, isEdit = false }: WarehouseFormProps) {
  return (
    <Form<CreateWarehouseInput, typeof createWarehouseSchema>
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
                <Warehouse className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Global Information</CardTitle>
              </div>
              <CardDescription>Basic details about the warehouse facility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField name="code" label="Warehouse Code">
                  {({ field }) => <Input {...field} placeholder="e.g. WH-001" disabled={isEdit} />}
                </FormField>

                <FormField name="name" label="Warehouse Name">
                  {({ field }) => <Input {...field} placeholder="e.g. Main Distribution Center" />}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <AddressSection control={form.control} name="addresses" />
            <BinSection control={form.control} name="bins" />
          </div>
        </div>
      )}
    </Form>
  );
}
