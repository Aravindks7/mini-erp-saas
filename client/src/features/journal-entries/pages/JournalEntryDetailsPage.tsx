import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Ban, AlertCircle, Calendar, Hash, FileText, Send, FileEdit } from 'lucide-react';
import * as React from 'react';
import { format } from 'date-fns';

import { useJournalEntry, useVoidJournalEntry } from '../hooks/journal-entries.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const journalStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  posted: { label: 'Posted', tone: 'success' },
  void: { label: 'Voided', tone: 'danger' },
};

export default function JournalEntryDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: entry, isLoading, isError } = useJournalEntry(id);
  const { mutate: voidEntry, status: voidStatus } = useVoidJournalEntry();

  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !entry) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Entry Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The journal entry you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/finance/journal-entries'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to General Ledger
          </button>
        </div>
      </PageContainer>
    );
  }

  const handleVoid = () => {
    voidEntry(entry.id, {
      onSuccess: () => {
        setIsVoidDialogOpen(false);
        toast.success('Journal entry voided successfully');
      },
    });
  };

  const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);

  const actions = [];

  if (entry.status === 'draft') {
    actions.push(
      {
        label: 'Post Entry',
        onClick: () => {}, // TODO: Implement post logic
        icon: <Send className="h-4 w-4" />,
      },
      {
        label: 'Edit',
        onClick: () => navigate(getPath(`/finance/journal-entries/${entry.id}/edit`)),
        icon: <FileEdit className="h-4 w-4" />,
      },
    );
  }

  if (entry.status === 'posted') {
    actions.push({
      label: 'Void Entry',
      onClick: () => setIsVoidDialogOpen(true),
      icon: <Ban className="h-4 w-4" />,
      variant: 'destructive' as const,
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Entry: ${entry.reference || entry.id.slice(0, 8)}`}
        description="Detailed transaction record and ledger impact."
        backButton={{ href: getPath('/finance/journal-entries'), label: 'Back to Ledger' }}
        actions={actions}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={entry.status} statusMap={journalStatusMap} />
        </div>
      </PageHeader>

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-muted-foreground/20 shadow-sm">
            <CardHeader className="bg-muted/30 border-b py-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">Transaction Lines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10 border-b">
                    <TableHead className="w-[300px]">Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm">{line.account.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {line.account.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm italic">
                        {line.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(line.debit) > 0
                          ? Number(line.debit).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(line.credit) > 0
                          ? Number(line.credit).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/5 font-bold border-t-2">
                    <TableCell colSpan={2}>Totals</TableCell>
                    <TableCell className="text-right font-mono">
                      {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-muted-foreground/20 shadow-sm">
              <CardHeader className="bg-muted/30 border-b py-3">
                <CardTitle className="text-base font-semibold">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Transaction Date
                    </span>
                    <span className="text-sm">{format(new Date(entry.date), 'PPP')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Reference
                    </span>
                    <span className="text-sm font-mono">{entry.reference || 'None'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                      Memo
                    </span>
                    <span className="text-sm">{entry.description || 'No notes provided.'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <AuditInfo createdAt={entry.createdAt} updatedAt={entry.updatedAt} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isVoidDialogOpen}
        onClose={() => setIsVoidDialogOpen(false)}
        onConfirm={handleVoid}
        title="Void Journal Entry"
        description="Are you sure you want to void this entry? This action will reverse all ledger impacts. It cannot be undone."
        confirmLabel="Void Entry"
        variant="destructive"
        isLoading={voidStatus === 'pending'}
      />
    </PageContainer>
  );
}
