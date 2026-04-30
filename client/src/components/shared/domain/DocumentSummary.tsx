import * as React from 'react';
import { Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

interface SummaryLine {
  label: string;
  value: React.ReactNode;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

interface DocumentSummaryProps {
  title: string;
  status: string;
  statusMap: StatusMap<string>;
  lines: SummaryLine[];
  className?: string;
}

/**
 * Standardized Document Summary Card for transactional entities (Invoices, Bills, Orders).
 * Displays status and a breakdown of financial totals.
 */
export function DocumentSummary({
  title,
  status,
  statusMap,
  lines,
  className,
}: DocumentSummaryProps) {
  return (
    <Card className={cn('border-muted-foreground/20 overflow-hidden shadow-sm h-fit', className)}>
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-dashed">
          <span className="text-sm text-muted-foreground">Status</span>
          <StatusBadge value={status} statusMap={statusMap} />
        </div>
        <div className="space-y-2">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={cn(
                'flex justify-between text-sm',
                line.isTotal && 'pt-2 border-t font-bold text-xl text-primary',
                line.isSubtotal && 'text-muted-foreground',
              )}
            >
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
