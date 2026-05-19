import { Boxes, Package, ClipboardList, ArrowLeftRight, History } from 'lucide-react';
import ModuleLandingPage from '@/components/shared/ModuleLandingPage';
import { APP_PATHS } from '@/lib/paths';

export default function InventoryModulePage() {
  return (
    <ModuleLandingPage
      title="Inventory"
      description="Monitor stock levels, manage products, and track warehouse movements."
      icon={Boxes}
      modules={[
        {
          title: 'Products',
          description: 'Catalog management and product specifications',
          path: APP_PATHS.inventory.products.list(),
          icon: Package,
          actionLabel: 'Manage Catalog',
        },
        {
          title: 'Stock Levels',
          description: 'Real-time stock availability across warehouses',
          path: APP_PATHS.inventory.levels.list(),
          icon: Boxes,
          actionLabel: 'View Availability',
        },
        {
          title: 'Adjustments',
          description: 'Stock corrections and audit adjustments',
          path: APP_PATHS.inventory.adjustments.list(),
          icon: ClipboardList,
          actionLabel: 'Manage Adjustments',
        },
        {
          title: 'Transfers',
          description: 'Inter-warehouse stock movements',
          path: APP_PATHS.inventory.transfers.list(),
          icon: ArrowLeftRight,
          actionLabel: 'Track Movements',
        },
        {
          title: 'Ledger',
          description: 'Full historical audit trail of stock movements',
          path: APP_PATHS.inventory.ledger(),
          icon: History,
          actionLabel: 'Audit Trail',
        },
      ]}
    />
  );
}
