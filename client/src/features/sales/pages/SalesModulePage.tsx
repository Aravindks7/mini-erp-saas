import { CircleDollarSign, Users, LayoutList, FileText, Truck } from 'lucide-react';
import ModuleLandingPage from '@/components/shared/ModuleLandingPage';
import { APP_PATHS } from '@/lib/paths';

export default function SalesModulePage() {
  return (
    <ModuleLandingPage
      title="Sales"
      description="Manage your customer relationships, sales orders, and revenue cycle."
      icon={CircleDollarSign}
      modules={[
        {
          title: 'Customers',
          description: 'CRM and customer contact management',
          path: APP_PATHS.sales.customers.list(),
          icon: Users,
          actionLabel: 'Manage Directory',
        },
        {
          title: 'Orders',
          description: 'Sales orders and quotations',
          path: APP_PATHS.sales.orders.list(),
          icon: LayoutList,
          actionLabel: 'View Sales Orders',
        },
        {
          title: 'Invoices',
          description: 'Billing and revenue tracking',
          path: APP_PATHS.sales.invoices.list(),
          icon: FileText,
          actionLabel: 'Manage Billing',
        },
        {
          title: 'Shipments',
          description: 'Logistics and delivery tracking',
          path: APP_PATHS.sales.shipments.list(),
          icon: Truck,
          actionLabel: 'Track Shipments',
        },
      ]}
    />
  );
}
