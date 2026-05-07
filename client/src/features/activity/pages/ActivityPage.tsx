import React from 'react';
import {
  Activity,
  X,
  ShoppingCart,
  Package,
  FileText,
  Receipt,
  Users,
  Truck,
  Boxes,
  Layers,
  CreditCard,
  DollarSign,
  User,
  ShieldCheck,
  Percent,
  Ruler,
  Warehouse,
  Archive,
  RefreshCcw,
  ClipboardCheck,
  Book,
  Hash,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useOrganizationActivity } from '../hooks/activity.hooks';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useDebounce } from '@/hooks/useDebounce';
import { DateRangePicker } from '@/components/shared/form/DateRangePicker';
import { SearchInput } from '@/components/shared/SearchInput';
import { MultiFilter } from '@/components/shared/MultiFilter';
import { InfiniteScrollTrigger } from '@/components/shared/InfiniteScrollTrigger';

const ENTITY_OPTIONS = [
  { label: 'Sales Orders', value: 'sales_order', icon: ShoppingCart },
  { label: 'Purchase Orders', value: 'purchase_order', icon: Package },
  { label: 'Invoices', value: 'invoice', icon: FileText },
  { label: 'Bills', value: 'bill', icon: Receipt },
  { label: 'Customers', value: 'customer', icon: Users },
  { label: 'Suppliers', value: 'supplier', icon: Truck },
  { label: 'Products', value: 'product', icon: Boxes },
  { label: 'Categories', value: 'product_category', icon: Layers },
  { label: 'Payments', value: 'payment', icon: CreditCard },
  { label: 'Stripe Intents', value: 'payment_intent', icon: DollarSign },
  { label: 'Users', value: 'user', icon: User },
  { label: 'Roles', value: 'role', icon: ShieldCheck },
  { label: 'Taxes', value: 'tax', icon: Percent },
  { label: 'UoMs', value: 'uom', icon: Ruler },
  { label: 'Warehouses', value: 'warehouse', icon: Warehouse },
  { label: 'Bins', value: 'bin', icon: Archive },
  { label: 'Adjustments', value: 'inventory_adjustment', icon: RefreshCcw },
  { label: 'Receipts', value: 'receipt', icon: ClipboardCheck },
  { label: 'Journal Entries', value: 'journal_entry', icon: Book },
  { label: 'Sequences', value: 'sequence', icon: Hash },
];

export default function ActivityPage() {
  // Filter States
  const [activeEntityTypes, setActiveEntityTypes] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useOrganizationActivity({
      entityType: activeEntityTypes.length > 0 ? activeEntityTypes.join(',') : undefined,
      search: debouncedSearch || undefined,
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
    });

  const allItems = React.useMemo(
    () =>
      data?.pages.flatMap((page) =>
        page.items.map((item) => {
          const snapshot = item.snapshot as Record<string, unknown> | null;
          const documentNumber =
            snapshot && 'documentNumber' in snapshot ? (snapshot.documentNumber as string) : null;

          return {
            ...item,
            entityDisplayId: documentNumber || item.entityId.slice(0, 8),
            entityLabel: item.entityType.replace(/_/g, ' ').toUpperCase(),
          };
        }),
      ) ?? [],
    [data],
  );

  const clearFilters = () => {
    setActiveEntityTypes([]);
    setSearch('');
    setDateRange(undefined);
  };

  const hasActiveFilters = activeEntityTypes.length > 0 || search || dateRange;

  return (
    <PageContainer>
      <PageHeader
        title="Activity Feed"
        description="A complete audit trail of all business activities across your organization."
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <div className="flex items-center gap-1.5">
            <Activity className="size-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {allItems.length} event{allItems.length !== 1 ? 's' : ''} loaded
            </span>
          </div>
        </div>
      </PageHeader>

      {/* Sticky Filter Toolbar */}
      <div className="sticky top-16 z-30 pt-4 bg-background/80 backdrop-blur-xs">
        <Card className="shadow-md border-border/60 mb-8">
          <CardContent className="space-y-4">
            {/* Top Row: Search and Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-12 gap-4">
              <div className="sm:col-span-3 md:col-span-5">
                <SearchInput
                  placeholder="Search by action, entity, or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  isLoading={isFetching && !!search}
                  className="h-10"
                />
              </div>
              <div className="sm:col-span-2 md:col-span-4 flex gap-2">
                <div className="flex-1">
                  <DateRangePicker value={dateRange} onChange={setDateRange} className="h-10" />
                </div>
                <MultiFilter
                  title="Entity Type"
                  options={ENTITY_OPTIONS}
                  selectedValues={activeEntityTypes}
                  onValuesChange={setActiveEntityTypes}
                />
              </div>
              <div className="sm:col-span-1 md:col-span-3 flex items-center justify-end">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground h-10 px-4"
                  >
                    <X className="size-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Section */}
      <div className="max-w-5xl mx-auto pb-20">
        <ActivityTimeline
          items={allItems}
          isLoading={isLoading}
          loadingMore={isFetchingNextPage}
          emptyMessage={
            hasActiveFilters
              ? 'No activities found matching your filters. Try adjusting your search or date range.'
              : 'No activity has been recorded yet.'
          }
        />

        <InfiniteScrollTrigger
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onIntersect={() => fetchNextPage()}
        />
      </div>
    </PageContainer>
  );
}
