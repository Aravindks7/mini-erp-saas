import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusConfig {
  label: string;
  tone: StatusTone;
}

export type StatusMap<T extends string> = Record<T, StatusConfig>;

interface StatusBadgeProps<T extends string> {
  value: T;
  statusMap: StatusMap<T>;
  className?: string;
}

const toneMap: Record<StatusTone, string> = {
  success:
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40',
  warning:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40',
  danger:
    'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/40',
  info: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40',
  neutral: 'bg-muted text-muted-foreground border-transparent',
};

/**
 * Generic Status Badge for ERP SaaS.
 * Highly decoupled; consumes a mapping of enums to semantic tones provided by each feature.
 */
export function StatusBadge<T extends string>({
  value,
  statusMap,
  className,
}: StatusBadgeProps<T>) {
  const config = (statusMap && value && statusMap[value]) || {
    label: value || 'Unknown',
    tone: 'neutral' as StatusTone,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium tracking-tight text-[10px] uppercase h-5',
        toneMap[config.tone],
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
