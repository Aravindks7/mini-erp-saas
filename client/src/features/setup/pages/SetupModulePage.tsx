import { Settings2, LayoutGrid, Ruler, Percent, Warehouse, Coins } from 'lucide-react';
import ModuleLandingPage from '@/components/shared/ModuleLandingPage';
import { APP_PATHS } from '@/lib/paths';

export default function SetupModulePage() {
  return (
    <ModuleLandingPage
      title="Setup"
      description="Configure your ERP system parameters, masters, and configurations."
      icon={Settings2}
      modules={[
        {
          title: 'Currencies',
          description: 'Multi-currency management and exchange rates',
          path: APP_PATHS.setup.currencies.list(),
          icon: Coins,
          actionLabel: 'Manage Currencies',
        },
        {
          title: 'Product Categories',
          description: 'Classification of items and products',
          path: APP_PATHS.setup.productCategories.list(),
          icon: LayoutGrid,
          actionLabel: 'Manage Groups',
        },
        {
          title: 'Units of Measure',
          description: 'Measurement units and conversions',
          path: APP_PATHS.setup.uom.list(),
          icon: Ruler,
          actionLabel: 'View Units',
        },
        {
          title: 'Taxes',
          description: 'Tax codes and rate configurations',
          path: APP_PATHS.setup.taxes.list(),
          icon: Percent,
          actionLabel: 'Configure Rates',
        },
        {
          title: 'Warehouses',
          description: 'Storage locations and fulfillment centers',
          path: APP_PATHS.setup.warehouses.list(),
          icon: Warehouse,
          actionLabel: 'Manage Sites',
        },
      ]}
    />
  );
}
