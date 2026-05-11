import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Activity, ArrowRight } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from './UserAvatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { Link } from 'react-router-dom';
import { useTenantPath } from '@/hooks/useTenantPath';
import {
  getActionDisplayConfig,
  getEntityDisplayConfig,
  getEntityPath,
  getStatusMap,
} from '@/features/activity/lib/activity-mapping';

export interface ActivityTimelineItem {
  id: string;
  entityType: string;
  entityId: string;
  entityDisplayId: string;
  entityLabel: string;
  action: string;
  reason: string | null;
  snapshot: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
  user?: {
    name: string;
    image: string | null;
  } | null;
}

interface ActivityTimelineProps {
  items: ActivityTimelineItem[];
  isLoading?: boolean;
  loadingMore?: boolean;
  emptyMessage?: string;
  className?: string;
}

function formatGroupDate(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) return 'TODAY';
  if (isYesterday(date)) return 'YESTERDAY';

  return format(date, 'dd/MM/yyyy');
}

/**
 * Helper to convert snake_case or plain text to Title Case.
 */
function toTitleCase(str: string) {
  return str
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Domain-agnostic Activity Timeline component.
 * Renders an immutable audit trail as a premium vertical timeline.
 * Rule 7.1: No business logic or API calls. Purely presentational.
 */
export function ActivityTimeline({
  items,
  isLoading,
  loadingMore,
  emptyMessage = 'No activity recorded yet.',
  className,
}: ActivityTimelineProps) {
  const { getPath } = useTenantPath();
  const groupedItems = useMemo(() => {
    const groups: { date: string; items: ActivityTimelineItem[] }[] = [];
    items.forEach((item) => {
      const dateLabel = formatGroupDate(item.createdAt);
      const group = groups.find((g) => g.date === dateLabel);
      if (group) {
        group.items.push(item);
      } else {
        groups.push({ date: dateLabel, items: [item] });
      }
    });
    return groups;
  }, [items]);

  if (isLoading) {
    return (
      <div className={cn('space-y-16', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex gap-4 animate-pulse ml-4">
                <div className="size-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-muted/30 p-6 rounded-full mb-4">
          <Activity className="size-10 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('space-y-10', className)}>
        {groupedItems.map((group) => (
          <div key={group.date} className="space-y-6">
            {/* Date Header */}
            <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground/70 uppercase flex items-center gap-4">
              {group.date}
              <div className="h-px flex-1 bg-border/40" />
            </h3>

            <div className="space-y-7 ml-1">
              {group.items.map((item) => {
                const config = getActionDisplayConfig(item.action);
                const entityConfig = getEntityDisplayConfig(item.entityType);
                const snapshot = item.snapshot as Record<string, unknown> | null;
                const Icon = config.icon;
                const EntityIcon = entityConfig.icon;

                const isLastGlobal = item.id === items[items.length - 1]?.id;

                const hasStatus = Boolean(
                  (snapshot?.previousStatus && snapshot?.newStatus) ||
                  (snapshot?.status &&
                    typeof snapshot.status === 'object' &&
                    'from' in snapshot.status &&
                    'to' in snapshot.status),
                );

                const statusFrom = snapshot?.previousStatus || (snapshot?.status as any)?.from;
                const statusTo = snapshot?.newStatus || (snapshot?.status as any)?.to;

                const otherDiffs = snapshot
                  ? Object.entries(snapshot).filter(([key, value]) => {
                      if (key === 'previousStatus' || key === 'newStatus' || key === 'status')
                        return false;
                      if (typeof value !== 'object' || value === null) return false;
                      return (
                        ('from' in value && 'to' in value) || ('old' in value && 'new' in value)
                      );
                    })
                  : [];
                const hasVisibleSnapshot = hasStatus || otherDiffs.length > 0;

                const entityBasePath = getEntityPath(item.entityType);
                const linkPath = entityBasePath
                  ? getPath(`${entityBasePath}/${item.entityId}`)
                  : null;

                return (
                  <div key={item.id} className="group/item">
                    {/* Header Row: Naturally aligned by flex-center */}
                    <div className="flex items-center gap-4">
                      {/* Time */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-16 shrink-0 text-right cursor-default">
                            <span className="text-[11px] font-medium text-muted-foreground tabular-nums leading-none">
                              {new Date(item.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          {format(new Date(item.createdAt), 'PPpp')}
                        </TooltipContent>
                      </Tooltip>

                      {/* Icon */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'z-10 size-6 rounded-full border-2 border-background flex items-center justify-center shadow-sm shrink-0 cursor-default',
                              config.color,
                            )}
                          >
                            <Icon className="size-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{config.label}</TooltipContent>
                      </Tooltip>

                      {/* Content Header */}
                      <div className="flex-1 flex items-center flex-wrap gap-1 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-semibold transition-colors flex items-center gap-1 px-2 h-6 text-[10px] uppercase',
                            entityConfig.color,
                          )}
                        >
                          <EntityIcon />
                          {item.entityLabel || toTitleCase(item.entityType)}
                        </Badge>

                        {linkPath ? (
                          <Link
                            to={linkPath}
                            className="font-mono text-sm font-bold text-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {item.entityDisplayId}
                          </Link>
                        ) : (
                          <span className="font-mono text-sm font-bold text-foreground">
                            {item.entityDisplayId}
                          </span>
                        )}

                        <span className="text-xs text-muted-foreground">{config.label}</span>
                        <span className="text-xs text-muted-foreground">by</span>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default">
                              <UserAvatar user={item.user} size="sm" />
                              <span className="text-xs font-semibold text-foreground">
                                {item.user?.name || 'Unknown User'}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{item.user?.name || 'Unknown User'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Detail Row: Rail and Body */}
                    <div className="flex gap-4">
                      {/* Time Spacer */}
                      <div className="w-16 shrink-0" />

                      {/* Rail Column */}
                      <div className="w-6 shrink-0 flex justify-center relative min-h-6">
                        {!isLastGlobal && (
                          <div className="absolute top-0 bottom-[-28px] w-px bg-border/40" />
                        )}
                      </div>

                      {/* Body Content */}
                      <div className="flex-1 pt-1.5 pb-3 space-y-3 min-w-0">
                        {item.reason && (
                          <div className="bg-muted/20 border border-border/40 rounded-lg p-3 max-w-2xl">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.reason}
                            </p>
                          </div>
                        )}

                        {/* Bottom Row: Status */}
                        {hasVisibleSnapshot && (
                          <div className="flex flex-col">
                            {hasStatus ? (
                              <div className="flex items-center gap-2 text-[12px]">
                                <span className="text-muted-foreground font-medium">Status:</span>
                                {getStatusMap(item.entityType) ? (
                                  <>
                                    <StatusBadge
                                      value={String(statusFrom)}
                                      statusMap={getStatusMap(item.entityType)!}
                                    />
                                    <ArrowRight className="size-3 text-muted-foreground/40" />
                                    <StatusBadge
                                      value={String(statusTo)}
                                      statusMap={getStatusMap(item.entityType)!}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <Badge
                                      variant="outline"
                                      className="h-5 text-[10px] uppercase font-bold text-muted-foreground bg-muted/30"
                                    >
                                      {String(statusFrom)}
                                    </Badge>
                                    <ArrowRight className="size-3 text-muted-foreground/40" />
                                    <Badge
                                      variant="outline"
                                      className="h-5 text-[10px] uppercase font-bold text-primary bg-primary/5 border-primary/20"
                                    >
                                      {String(statusTo)}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            ) : null}

                            {/* Other snapshot diffs */}
                            {otherDiffs.map(([key, value]) => {
                              const diff = value as {
                                from?: unknown;
                                to?: unknown;
                                old?: unknown;
                                new?: unknown;
                              };
                              const from = diff.from ?? diff.old;
                              const to = diff.to ?? diff.new;

                              return (
                                <div key={key} className="flex items-center gap-2 text-[12px]">
                                  <span className="text-muted-foreground font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                  </span>
                                  <span className="text-muted-foreground line-through opacity-60">
                                    {String(from)}
                                  </span>
                                  <ArrowRight className="size-3 text-muted-foreground/40" />
                                  <span className="text-foreground font-semibold">
                                    {String(to)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {loadingMore && (
          <div className="space-y-7 ml-1 mt-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`loading-more-${i}`} className="flex gap-4 animate-pulse">
                <div className="w-16 h-4 bg-muted rounded shrink-0 mt-1" />
                <div className="size-6 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
