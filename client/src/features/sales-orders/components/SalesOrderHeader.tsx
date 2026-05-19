import { format } from 'date-fns';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { APP_PATHS } from '@/lib/paths';
import {
  PageHeader,
  type PageHeaderAction,
  type PageHeaderNavigation,
} from '@/components/shared/PageHeader';

interface SalesOrderHeaderProps {
  orderNumber: string;
  status: string;
  createdAt: string;
  onEdit: () => void;
  actions?: PageHeaderAction[];
  primaryActionCount?: number;
  navigation?: PageHeaderNavigation;
}

export function SalesOrderHeader({
  orderNumber,
  status,
  createdAt,
  actions = [],
  primaryActionCount = 1,
  navigation,
}: SalesOrderHeaderProps) {
  return (
    <PageHeader
      title={
        <div className="flex flex-wrap items-center gap-3">
          Order ID: <span className="text-foreground/80">#{orderNumber}</span>
          <div className="flex gap-2">
            <StatusBadge value={status} entityType="sales_order" className="rounded-full px-3" />
          </div>
        </div>
      }
      description={format(new Date(createdAt), "MMMM d, yyyy 'at' h:mm a") + ' • Sales Order'}
      backButton={{
        label: 'Orders',
        href: APP_PATHS.sales.orders.list(),
      }}
      actions={actions}
      actionLayout="dropdown"
      primaryActionCount={primaryActionCount}
      navigation={navigation}
    />
  );
}
