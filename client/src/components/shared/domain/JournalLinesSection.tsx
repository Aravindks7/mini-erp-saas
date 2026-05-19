import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { FieldValues, ArrayPath, Control, Path, PathValue } from 'react-hook-form';
import { Plus, Trash2, Scale } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form/FormField';
import { SearchableSelect } from '@/components/shared/form/SearchableSelect';
import { FormSection } from '@/components/shared/form/FormSection';
import { AmountInput } from '@/components/shared/form/AmountInput';

import { useAccountsQuery } from '@/features/accounts/hooks/accounts.hooks';
import { cn } from '@/lib/utils';

interface JournalLinesSectionProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  title?: string;
  description?: string;
}

/**
 * Specialized Line Items component for Journal Entries.
 * Handles double-entry lines with Account selection, Debit, and Credit inputs.
 * Axiom: Enforces balanced ledger rules with real-time feedback.
 */
export function JournalLinesSection<TFieldValues extends FieldValues>({
  name,
  title = 'Journal Lines',
  description = 'Add at least two lines. Total debits must equal total credits.',
}: JournalLinesSectionProps<TFieldValues>) {
  const { control, setValue } = useFormContext<TFieldValues>();
  const { fields, append, remove } = useFieldArray({ control, name });

  const { data: accounts } = useAccountsQuery();

  const lines = useWatch({
    control,
    name: name as unknown as Path<TFieldValues>,
  });

  const accountOptions = (accounts || []).map((a) => ({
    label: `${a.code} - ${a.name}`,
    value: a.id,
  }));

  interface JournalLine {
    debit?: string | number;
    credit?: string | number;
  }

  // Calculate totals for real-time feedback
  const totalDebit = ((lines as JournalLine[]) || []).reduce(
    (sum: number, line: JournalLine) => sum + Number(line?.debit || 0),
    0,
  );
  const totalCredit = ((lines as JournalLine[]) || []).reduce(
    (sum: number, line: JournalLine) => sum + Number(line?.credit || 0),
    0,
  );
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && (lines?.length || 0) >= 2;

  return (
    <FormSection title={title} description={description} columns={1}>
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-12 gap-4 items-end border p-4 rounded-lg bg-muted/20 relative group transition-all hover:border-primary/30"
          >
            <div className="col-span-4">
              <FormField name={`${name}.${index}.accountId`} label="Account">
                {({ field: aField }) => (
                  <SearchableSelect
                    {...aField}
                    options={accountOptions}
                    placeholder="Select Account"
                  />
                )}
              </FormField>
            </div>

            <div className="col-span-3">
              <FormField name={`${name}.${index}.description`} label="Description (Optional)">
                {({ field: dField }) => (
                  <Input {...dField} value={dField.value ?? ''} placeholder="Line description" />
                )}
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField name={`${name}.${index}.debit`} label="Debit">
                {({ field: debitField }) => (
                  <AmountInput
                    {...debitField}
                    currency="USD"
                    onChange={(val) => {
                      debitField.onChange(val);
                      if (Number(val) > 0) {
                        setValue(
                          `${name}.${index}.credit` as Path<TFieldValues>,
                          0 as PathValue<TFieldValues, Path<TFieldValues>>,
                        );
                      }
                    }}
                  />
                )}
              </FormField>
            </div>

            <div className="col-span-2">
              <FormField name={`${name}.${index}.credit`} label="Credit">
                {({ field: creditField }) => (
                  <AmountInput
                    {...creditField}
                    currency="USD"
                    onChange={(val) => {
                      creditField.onChange(val);
                      if (Number(val) > 0) {
                        setValue(
                          `${name}.${index}.debit` as Path<TFieldValues>,
                          0 as PathValue<TFieldValues, Path<TFieldValues>>,
                        );
                      }
                    }}
                  />
                )}
              </FormField>
            </div>

            <div className="col-span-1 flex justify-end pb-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => remove(index)}
                disabled={fields.length <= 2} // Minimum 2 lines required for JE
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-dashed px-8"
            onClick={() =>
              append({
                accountId: '',
                debit: 0,
                credit: 0,
                description: '',
              } as PathValue<TFieldValues, ArrayPath<TFieldValues>>[number])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Journal Line
          </Button>

          <div
            className={cn(
              'flex items-center gap-6 px-6 py-2 rounded-full border text-sm font-medium transition-colors shadow-sm',
              isBalanced
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-warning/10 border-warning/30 text-warning',
            )}
          >
            <div className="flex items-center gap-2">
              <Scale className={cn('h-4 w-4', !isBalanced && 'animate-pulse')} />
              <span>{isBalanced ? 'Balanced' : 'Out of Balance'}</span>
            </div>
            <div className="flex gap-4 border-l pl-4 border-current/20">
              <div>
                Debits:{' '}
                <span className="font-mono font-bold">
                  {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                Credits:{' '}
                <span className="font-mono font-bold">
                  {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {!isBalanced && (
                <div className="text-destructive font-bold underline decoration-2 underline-offset-4">
                  Diff: {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
