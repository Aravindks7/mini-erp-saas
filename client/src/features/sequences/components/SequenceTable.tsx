import * as React from 'react';
import { Hash, Save, Loader2, Info, RotateCcw, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AUDIT_REASONS = [
  { label: 'New Fiscal Year / Period', value: 'New Fiscal Year / Period' },
  { label: 'Corporate Format Standardization', value: 'Corporate Format Standardization' },
  { label: 'Correcting Configuration Error', value: 'Correcting Configuration Error' },
  { label: 'Module Reset / Re-initialization', value: 'Module Reset / Re-initialization' },
  { label: 'Regulatory Compliance Update', value: 'Regulatory Compliance Update' },
];

import { useUpdateSequence } from '../hooks/sequences.hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TokenInput } from './TokenInput';
import { useSequenceForm } from '../hooks/useSequenceForm';
import {
  type UpdateDocumentSequenceInput,
  type DocumentSequenceResponse,
} from '@shared/contracts/sequences.contract';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form } from '@/components/shared/form/Form';
import { FormField } from '@/components/shared/form/FormField';

interface SequenceTableProps {
  sequences: DocumentSequenceResponse[];
}

export function SequenceTable({ sequences }: SequenceTableProps) {
  return (
    <div className="rounded-md border border-border overflow-hidden bg-background shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] font-bold text-foreground">Module</TableHead>
            <TableHead className="w-[280px] font-bold text-foreground">Numbering Format</TableHead>
            <TableHead className="w-[120px] font-bold text-center text-foreground">
              Padding
            </TableHead>
            <TableHead className="min-w-[200px] font-bold text-foreground">Preview</TableHead>
            <TableHead className="w-[180px] text-right text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sequences.map((sequence) => (
            <SequenceRow key={sequence.id} sequence={sequence} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SequenceRow({ sequence }: { sequence: DocumentSequenceResponse }) {
  const { mutateAsync: updateSequence, isPending } = useUpdateSequence();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const { form, isDirty, resetForm } = useSequenceForm(sequence);

  const prefix = form.watch('prefix');
  const padding = form.watch('padding');
  const nextValue = form.watch('nextValue');

  // Logic to resolve tokens for preview
  const resolvePreview = (p: string, pad: number, val: number) => {
    const now = new Date();
    const resolved = p
      .replace(/\[YYYY\]/g, now.getFullYear().toString())
      .replace(/\[YY\]/g, now.getFullYear().toString().slice(-2))
      .replace(/\[MM\]/g, (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace(/\[DD\]/g, now.getDate().toString().padStart(2, '0'));

    return `${resolved}${val.toString().padStart(pad, '0')}`;
  };

  const resolvedSequence = resolvePreview(prefix, padding, nextValue || sequence.nextValue);

  const handleOpenConfirm = async () => {
    const isValid = await form.trigger(['prefix', 'padding']);
    if (isValid) {
      setIsConfirmOpen(true);
    }
  };

  const onConfirmSave = async (data: UpdateDocumentSequenceInput) => {
    await updateSequence({ id: sequence.id, data });
    form.reset(data);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <TableRow className="group hover:bg-muted/20 transition-colors border-border">
        <TableCell className="font-medium align-top pt-5">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
            <span className="uppercase tracking-wider text-[11px] font-bold text-muted-foreground group-hover:text-foreground">
              {sequence.type}
            </span>
          </div>
        </TableCell>
        <TableCell className="align-top pt-4">
          <TokenInput
            {...form.register('prefix')}
            placeholder="e.g. INV-[YYYY]-"
            className="h-9 focus-visible:ring-primary"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              form.setValue('prefix', e.target.value, { shouldDirty: true })
            }
          />
        </TableCell>
        <TableCell className="align-top pt-4 text-center">
          <Input
            type="number"
            className="w-20 mx-auto text-center font-mono h-9 focus-visible:ring-primary"
            {...form.register('padding', { valueAsNumber: true })}
            min={1}
            max={10}
          />
        </TableCell>
        <TableCell className="align-top pt-4">
          <div className="flex items-center gap-2 bg-muted/30 border border-border px-3 h-9 rounded-md font-mono text-sm font-bold text-primary truncate max-w-[250px]">
            {resolvedSequence}
          </div>
        </TableCell>
        <TableCell className="align-top pt-4 text-right">
          <div className="flex items-center justify-end gap-2">
            {isDirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="h-9 px-3 text-muted-foreground hover:text-foreground hover:bg-muted animate-in fade-in slide-in-from-right-2 duration-200"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Undo
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleOpenConfirm}
              disabled={!isDirty || isPending}
              className="h-9 px-4 shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Info className="h-5 w-5 text-primary" />
              </div>
              Audit Compliance Check
            </DialogTitle>
            <DialogDescription className="pt-2">
              Numbering format changes affect all future documents. Please provide a reason for this
              update.
            </DialogDescription>
          </DialogHeader>
          <Form form={form} onSubmit={onConfirmSave}>
            {(f) => (
              <div className="space-y-4 py-4">
                <FormField name="nextValue" label="Next Number">
                  {({ field }) => (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => form.setValue('nextValue', 1, { shouldDirty: true })}
                        title="Reset to 1"
                      >
                        <RefreshCw />
                      </Button>
                    </div>
                  )}
                </FormField>

                <FormField name="reason" label="Reason for Change">
                  {({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="focus:ring-primary h-10">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIT_REASONS.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                <DialogFooter className="pt-4 space-x-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmOpen(false)}
                    className="hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || f.formState.isSubmitting}
                    className="shadow-sm"
                  >
                    {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Confirm Update
                  </Button>
                </DialogFooter>
              </div>
            )}
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
