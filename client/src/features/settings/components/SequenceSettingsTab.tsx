import { useSequences } from '@/features/sequences/hooks/sequences.hooks';
import { DataTableSkeleton } from '@/components/shared/data-table/DataTableSkeleton';
import { SequenceTable } from '@/features/sequences/components/SequenceTable';

/**
 * SequenceSettingsTab: Unified interface for managing document numbering.
 * Now features a dense table layout with dynamic tokens and forensic auditing.
 */
export function SequenceSettingsTab() {
  const { data: sequences, isLoading } = useSequences();

  if (isLoading) {
    return (
      <DataTableSkeleton
        columnCount={5}
        rowCount={6}
        showTitle={true}
        showDescription={true}
        showPrimaryAction={false}
        showToolbar={false}
        showPagination={false}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold tracking-tight">Document Numbering</h3>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Define the format and sequences for your business documents. Use tokens like{' '}
          <code className="text-primary font-bold text-xs">[YYYY]</code> for dynamic date-based
          numbering.
        </p>
      </div>

      <SequenceTable sequences={sequences || []} />
    </div>
  );
}
