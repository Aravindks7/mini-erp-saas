import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, Save, Loader2 } from 'lucide-react';

import { useSequences, useUpdateSequence } from '../hooks/sequences.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import {
  updateDocumentSequenceSchema,
  type UpdateDocumentSequenceInput,
  type DocumentSequenceResponse,
} from '@shared/contracts/sequences.contract';

export function SequenceSettingsTab() {
  const { data: sequences, isLoading } = useSequences();

  if (isLoading) return <SkeletonLoader variant="list" rows={3} />;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">Document Numbering</h3>
        <p className="text-sm text-muted-foreground">
          Customize the prefixes and numbering format for your business documents.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {sequences?.map((sequence) => (
          <SequenceForm key={sequence.id} sequence={sequence} />
        ))}
      </div>
    </div>
  );
}

function SequenceForm({ sequence }: { sequence: DocumentSequenceResponse }) {
  const { mutateAsync: updateSequence, isPending } = useUpdateSequence();

  const form = useForm<UpdateDocumentSequenceInput>({
    resolver: zodResolver(updateDocumentSequenceSchema),
    defaultValues: {
      prefix: sequence.prefix,
      padding: sequence.padding,
    },
  });

  // Keep form in sync with server data and reset isDirty flag
  React.useEffect(() => {
    form.reset({
      prefix: sequence.prefix,
      padding: sequence.padding,
    });
  }, [sequence.prefix, sequence.padding, form]);

  const onSubmit = async (data: UpdateDocumentSequenceInput) => {
    await updateSequence({ id: sequence.id, data });
    // Reset isDirty state immediately after successful submission
    form.reset(data);
  };

  const prefix = useWatch({ control: form.control, name: 'prefix' });
  const padding = useWatch({ control: form.control, name: 'padding' });

  const nextDisplay = `${prefix}${sequence.nextValue.toString().padStart(padding, '0')}`;

  return (
    <Card className="border-muted-foreground/20 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 py-4 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Hash className="h-4 w-4 text-primary shrink-0" />
            <CardTitle className="text-sm md:text-base uppercase tracking-wider truncate">
              {sequence.type} Sequence
            </CardTitle>
          </div>
          <div className="text-xs font-mono bg-background px-2 py-1 rounded border self-start sm:self-auto shrink-0">
            Next: <span className="text-primary font-bold">{nextDisplay}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form<UpdateDocumentSequenceInput, typeof updateDocumentSequenceSchema>
          form={form}
          onSubmit={onSubmit}
          className="grid"
        >
          {() => (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField name="prefix" label="Prefix">
                  {({ field }) => <Input {...field} placeholder="e.g. INV-" />}
                </FormField>
                <FormField name="padding" label="Number Padding">
                  {({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      min={1}
                      max={10}
                    />
                  )}
                </FormField>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </Form>
      </CardContent>
    </Card>
  );
}
