import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowRight,
  PlusCircle,
  RefreshCcw,
  CheckCircle2,
  Ban,
  Truck,
  FileText,
  Receipt,
  DollarSign,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  CreditCard,
  User,
  ShieldCheck,
  Percent,
  Ruler,
  Layers,
  Warehouse,
  Archive,
  ClipboardCheck,
  Book,
  Hash,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isToday, isYesterday, format } from 'date-fns';

const ENTITY_CONFIG: Record<string, { color: string; icon: LucideIcon }> = {
  sales_order: {
    color:
      'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20',
    icon: ShoppingCart,
  },
  purchase_order: {
    color:
      'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20 hover:bg-orange-100 dark:hover:bg-orange-500/20',
    icon: Package,
  },
  invoice: {
    color:
      'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
    icon: FileText,
  },
  bill: {
    color:
      'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: Receipt,
  },
  customer: {
    color:
      'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20',
    icon: Users,
  },
  supplier: {
    color:
      'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-500/10 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20',
    icon: Truck,
  },
  product: {
    color:
      'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20',
    icon: Boxes,
  },
  product_category: {
    color:
      'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: Layers,
  },
  payment: {
    color:
      'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20',
    icon: CreditCard,
  },
  payment_intent: {
    color:
      'text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20',
    icon: DollarSign,
  },
  user: {
    color:
      'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20 hover:bg-violet-100 dark:hover:bg-violet-500/20',
    icon: User,
  },
  role: {
    color:
      'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-500/10 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20',
    icon: ShieldCheck,
  },
  tax: {
    color:
      'text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-500/10 dark:border-zinc-500/20 hover:bg-zinc-100 dark:hover:bg-zinc-500/20',
    icon: Percent,
  },
  uom: {
    color:
      'text-neutral-600 bg-neutral-50 border-neutral-200 dark:text-neutral-400 dark:bg-neutral-500/10 dark:border-neutral-500/20 hover:bg-neutral-100 dark:hover:bg-neutral-500/20',
    icon: Ruler,
  },
  warehouse: {
    color:
      'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-500/10 dark:border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/20',
    icon: Warehouse,
  },
  bin: {
    color:
      'text-sky-600 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20',
    icon: Archive,
  },
  inventory_adjustment: {
    color:
      'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20',
    icon: RefreshCcw,
  },
  receipt: {
    color:
      'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20',
    icon: ClipboardCheck,
  },
  journal_entry: {
    color:
      'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20',
    icon: Book,
  },
  sequence: {
    color:
      'text-slate-500 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20',
    icon: Hash,
  },
};

function getEntityConfig(entityType: string) {
  return (
    ENTITY_CONFIG[entityType] || {
      color: 'text-muted-foreground bg-muted/40 border-border',
      icon: Activity,
    }
  );
}
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from './UserAvatar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';

// Import feature status maps for rich status badge rendering
import { invoiceStatusMap } from '@/features/invoices/components/columns';
import { salesOrderStatusMap } from '@/features/sales-orders/components/columns';
import { purchaseOrderStatusMap } from '@/features/purchase-orders/components/columns';
import { billStatusMap } from '@/features/bills/components/columns';

/**
 * Resolves the appropriate status map for a given entity type.
 */
function getStatusMap(entityType: string): StatusMap<string> | undefined {
  switch (entityType) {
    case 'invoice':
      return invoiceStatusMap;
    case 'sales_order':
      return salesOrderStatusMap;
    case 'purchase_order':
      return purchaseOrderStatusMap;
    case 'bill':
      return billStatusMap;
    default:
      return undefined;
  }
}

export interface ActivityTimelineItem {
  id: string;
  entityType: string;
  entityId: string;
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

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  STATUS_CHANGED: {
    label: 'Status Changed',
    color: 'text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
    icon: RefreshCcw,
  },
  ORDER_CREATED: {
    label: 'Order Created',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    icon: PlusCircle,
  },
  ORDER_APPROVED: {
    label: 'Order Approved',
    color: 'text-green-500 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20',
    icon: CheckCircle2,
  },
  ORDER_SHIPPED: {
    label: 'Order Shipped',
    color: 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20',
    icon: Truck,
  },
  INVOICE_POSTED: {
    label: 'Invoice Posted',
    color: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20',
    icon: FileText,
  },
  BILL_CREATED: {
    label: 'Bill Created',
    color: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
    icon: Receipt,
  },
  PAYMENT_RECEIVED: {
    label: 'Payment Received',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    icon: DollarSign,
  },
  VOIDED: {
    label: 'Voided',
    color: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
    icon: Ban,
  },
  CREATED: {
    label: 'Created',
    color: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
    icon: PlusCircle,
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] || {
      label: action
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      color: 'text-muted-foreground bg-muted',
      icon: Activity,
    }
  );
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
                const config = getActionConfig(item.action);
                const entityConfig = getEntityConfig(item.entityType);
                const snapshot = item.snapshot as Record<string, unknown> | null;
                const Icon = config.icon;
                const EntityIcon = entityConfig.icon;

                const isLastGlobal = item.id === items[items.length - 1]?.id;

                return (
                  <div key={item.id} className="group/item">
                    {/* Header Row: Naturally aligned by flex-center */}
                    <div className="flex items-center gap-4">
                      {/* Time */}
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-[11px] font-medium text-muted-foreground tabular-nums leading-none">
                          {new Date(item.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>

                      {/* Icon */}
                      <div
                        className={cn(
                          'z-10 size-6 rounded-full border-2 border-background flex items-center justify-center shadow-sm shrink-0',
                          config.color,
                        )}
                      >
                        <Icon className="size-3" />
                      </div>

                      {/* Content Header */}
                      <div className="flex-1 flex items-center flex-wrap gap-1 min-w-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-semibold transition-colors flex items-center gap-1 px-1.5 h-6 text-[10px]',
                            entityConfig.color,
                          )}
                        >
                          <EntityIcon className="size-3" />
                          {toTitleCase(item.entityType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground leading-none">
                          {config.label.toLowerCase()} by
                        </span>
                        <UserAvatar user={item.user} size="sm" />
                        <span className="text-xs font-semibold text-foreground leading-none">
                          {item.user?.name || 'Unknown User'}
                        </span>
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
                            <p className="text-[13px] text-muted-foreground leading-relaxed">
                              {item.reason}
                            </p>
                          </div>
                        )}

                        {snapshot && Object.keys(snapshot).length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {Object.entries(snapshot).map(([key, value]) => {
                              if (key === 'previousStatus' && snapshot.newStatus) {
                                const statusMap = getStatusMap(item.entityType);
                                return (
                                  <div
                                    key="status-transition"
                                    className="flex items-center gap-2 text-[12px]"
                                  >
                                    <span className="text-muted-foreground font-medium">
                                      Status:
                                    </span>
                                    {statusMap ? (
                                      <>
                                        <StatusBadge value={String(value)} statusMap={statusMap} />
                                        <ArrowRight className="size-3 text-muted-foreground/40" />
                                        <StatusBadge
                                          value={String(snapshot.newStatus)}
                                          statusMap={statusMap}
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <Badge
                                          variant="outline"
                                          className="h-5 text-[10px] uppercase font-bold text-muted-foreground bg-muted/30"
                                        >
                                          {String(value)}
                                        </Badge>
                                        <ArrowRight className="size-3 text-muted-foreground/40" />
                                        <Badge
                                          variant="outline"
                                          className="h-5 text-[10px] uppercase font-bold text-primary bg-primary/5 border-primary/20"
                                        >
                                          {String(snapshot.newStatus)}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                );
                              }
                              if (key === 'newStatus') return null;

                              if (
                                typeof value === 'object' &&
                                value !== null &&
                                'old' in value &&
                                'new' in value
                              ) {
                                const diff = value as { old: unknown; new: unknown };
                                return (
                                  <div key={key} className="flex items-center gap-2 text-[12px]">
                                    <span className="text-muted-foreground font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                    </span>
                                    <span className="text-muted-foreground line-through opacity-60">
                                      {String(diff.old)}
                                    </span>
                                    <ArrowRight className="size-3 text-muted-foreground/40" />
                                    <span className="text-foreground font-semibold">
                                      {String(diff.new)}
                                    </span>
                                  </div>
                                );
                              }
                              return null;
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
