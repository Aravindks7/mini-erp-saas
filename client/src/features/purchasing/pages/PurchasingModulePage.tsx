import { ShoppingCart, Truck, PackageSearch, ReceiptText } from 'lucide-react';
import ModuleLandingPage from '@/components/shared/ModuleLandingPage';
import { APP_PATHS } from '@/lib/paths';

export default function PurchasingModulePage() {
  return (
    <ModuleLandingPage
      title="Purchasing"
      description="Control your procurement process, from suppliers to purchase orders."
      icon={ShoppingCart}
      modules={[
        {
          title: 'Suppliers',
          description: 'Vendor management and procurement history',
          path: APP_PATHS.purchasing.suppliers.list(),
          icon: Truck,
          actionLabel: 'Manage Vendors',
        },
        {
          title: 'Orders',
          description: 'Purchase orders and procurement requests',
          path: APP_PATHS.purchasing.orders.list(),
          icon: ShoppingCart,
          actionLabel: 'View Purchase Orders',
        },
        {
          title: 'Receipts',
          description: 'Goods receiving and inbound logistics',
          path: APP_PATHS.purchasing.receipts.list(),
          icon: PackageSearch,
          actionLabel: 'Process Receipts',
        },
        {
          title: 'Bills',
          description: 'Accounts payable and vendor invoicing',
          path: APP_PATHS.purchasing.bills.list(),
          icon: ReceiptText,
          actionLabel: 'Manage Payables',
        },
      ]}
    />
  );
}
