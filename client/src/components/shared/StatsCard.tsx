import { ArrowUpIcon, ArrowDownIcon, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  className?: string;
}

/**
 * Premium Stats Card for ERP Dashboards.
 * Supports trend indicators, vibrant icon backgrounds, and clinical layout.
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden border-border/40 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300',
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn('p-2 rounded-xl bg-primary/5 ring-1 ring-primary/10', iconColor)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold tracking-tight text-foreground/90">{value}</div>
          {(trend || description) && (
            <div className="flex items-center gap-2 pt-1">
              {trend && (
                <div
                  className={cn(
                    'flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full ring-1',
                    trend.isPositive
                      ? 'text-emerald-600 bg-emerald-500/10 ring-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20'
                      : 'text-rose-600 bg-rose-500/10 ring-rose-500/20 dark:text-rose-400 dark:bg-rose-500/20',
                  )}
                >
                  {trend.isPositive ? (
                    <ArrowUpIcon className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : (
                    <ArrowDownIcon className="h-2.5 w-2.5" strokeWidth={3} />
                  )}
                  {trend.value}%
                </div>
              )}
              {description && (
                <p className="text-[11px] text-muted-foreground font-medium truncate">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      {/* Subtle bottom accent line */}
      <div className="h-[2px] w-full bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
