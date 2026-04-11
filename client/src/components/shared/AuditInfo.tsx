import { cn } from '@/lib/utils';
import { formatFullDate } from '@shared/utils/date';
import { History, UserCircle, Clock } from 'lucide-react';

interface AuditInfoProps {
  createdAt: Date | string;
  updatedAt?: Date | string;
  createdBy?: string;
  className?: string;
}

/**
 * Standard Audit Information Footer for ERP details.
 * Provides transparency on record lifecycle with clinical precision.
 */
export function AuditInfo({ createdAt, updatedAt, createdBy, className }: AuditInfoProps) {
  const hasBeenUpdated =
    updatedAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime();

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-dashed border-border/60 p-5 text-[11px] text-muted-foreground bg-muted/5',
        className,
      )}
    >
      <div className="flex items-center gap-2 font-medium text-foreground/40 uppercase tracking-wider mb-1">
        <History className="size-3" />
        Record History
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <Clock className="size-3.5 mt-0.5 opacity-50" />
          <div className="flex flex-col">
            <span className="font-semibold text-foreground/70">Created</span>
            <span className="tabular-nums">{formatFullDate(createdAt)}</span>
            {createdBy && (
              <span className="flex items-center gap-1 mt-1 font-medium text-primary/70">
                <UserCircle className="size-3" />
                {createdBy}
              </span>
            )}
          </div>
        </div>

        {hasBeenUpdated && (
          <div className="flex items-start gap-2 border-l border-border/40 pl-4 md:pl-6">
            <Clock className="size-3.5 mt-0.5 opacity-50" />
            <div className="flex flex-col">
              <span className="font-semibold text-foreground/70">Last Modified</span>
              <span className="tabular-nums">{formatFullDate(updatedAt!)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
