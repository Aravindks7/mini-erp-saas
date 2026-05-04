import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/shared/form/DatePicker';
import { JournalLinesSection } from '@/components/shared/domain/JournalLinesSection';

import {
  createJournalEntrySchema,
  type CreateJournalEntryInput,
} from '@shared/contracts/finance.contract';

interface JournalEntryFormProps {
  onSubmit: (data: CreateJournalEntryInput) => Promise<void>;
  formId?: string;
}

export function JournalEntryForm({ onSubmit, formId }: JournalEntryFormProps) {
  const form = useForm<CreateJournalEntryInput>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [
        { accountId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', debit: 0, credit: 0, description: '' },
      ],
    },
  });

  return (
    <Form<CreateJournalEntryInput, typeof createJournalEntrySchema>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form={form as any}
      onSubmit={onSubmit}
      id={formId}
      schema={createJournalEntrySchema}
      className="space-y-8"
    >
      {() => (
        <div className="space-y-8">
          <Card className="border-muted-foreground/20 shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Header Information</CardTitle>
              </div>
              <CardDescription>Basic transaction details for the journal entry.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <FormField name="date" label="Transaction Date">
                  {({ field }) => (
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    />
                  )}
                </FormField>

                <FormField name="reference" label="Reference (Optional)">
                  {({ field }) => (
                    <Input {...field} value={field.value ?? ''} placeholder="e.g. JE-2024-001" />
                  )}
                </FormField>

                <FormField
                  name="description"
                  label="Notes (Optional)"
                  className="sm:col-span-2 lg:col-span-1"
                >
                  {({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Transaction summary..."
                      className="resize-none h-10"
                    />
                  )}
                </FormField>
              </div>
            </CardContent>
          </Card>

          <JournalLinesSection control={form.control} name="lines" />
        </div>
      )}
    </Form>
  );
}
