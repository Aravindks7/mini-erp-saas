import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type EntityType, resolveStatusConfig } from '@/lib/status-registry';

export type StatusTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'secondary'
  | 'indigo'
  | 'purple'
  | 'teal'
  | 'orange';

export interface StatusConfig {
  label: string;
  tone: StatusTone;
}

export type StatusMap<T extends string> = Record<T, StatusConfig>;

interface StatusBadgeProps<T extends string> {
  value: T;
  statusMap?: StatusMap<T>;
  entityType?: EntityType;
  className?: string;
  variant?: 'default' | 'outline';
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
  secondary:
    'bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/40',
  indigo:
    'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/40',
  purple:
    'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40',
  teal: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/40',
  orange:
    'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/40',
};

/**
 * Generic Status Badge for ERP SaaS.
 * Highly decoupled; consumes a mapping of enums to semantic tones or resolves via Global Registry.
 */
export function StatusBadge<T extends string>({
  value,
  statusMap,
  entityType,
  className,
}: StatusBadgeProps<T>) {
  // 1. If entityType is provided, resolve via Global Registry (Preferred)
  // 2. If statusMap is provided, use it (Legacy/Specialized)
  // 3. Fallback to Neutral
  const config: StatusConfig = entityType
    ? resolveStatusConfig(entityType, value)
    : (statusMap && value && statusMap[value]) || {
        label: value || 'Unknown',
        tone: 'neutral',
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
