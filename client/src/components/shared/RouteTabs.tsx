import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RouteTabConfig {
  /** The human-readable tab name. */
  label: string;
  /** The relative sub-path this tab maps to. */
  path: string;
  /** Optional Lucide icon or other React component. */
  icon?: React.ReactNode;
}

interface RouteTabsProps {
  /** Array of tab configurations. */
  tabs: RouteTabConfig[];
  /** Base path for the feature (e.g., "/customers/123"). Defaults to the current parent path. */
  basePath?: string;
  /** Additional styling classes. */
  className?: string;
  /** Layout orientation. Default is horizontal. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * RouteTabs Component
 * A "Smart" tab component that syncs active state with the browser URL.
 * Essential for multi-faceted ERP views (Management, History, Settings).
 */
export function RouteTabs({
  tabs,
  basePath = '',
  className,
  orientation = 'horizontal',
}: RouteTabsProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine active tab based on longest matching path suffix
  const activeTab =
    tabs.find((tab) => {
      const fullTabPath = basePath ? `${basePath}/${tab.path}`.replace(/\/+/g, '/') : tab.path;
      return currentPath === fullTabPath || currentPath.endsWith(tab.path);
    })?.path || tabs[0]?.path;

  return (
    <Tabs
      value={activeTab}
      orientation={orientation}
      className={cn('w-full transition-all', className)}
    >
      <TabsList
        className={cn(
          'bg-muted/50 p-1',
          orientation === 'vertical'
            ? 'flex-col h-auto w-full items-start'
            : 'w-full justify-start overflow-x-auto no-scrollbar',
        )}
      >
        {tabs.map((tab) => {
          const to = basePath ? `${basePath}/${tab.path}` : tab.path;

          return (
            <TabsTrigger
              key={tab.path}
              value={tab.path}
              className={cn(
                'data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2',
                orientation === 'vertical' ? 'w-full justify-start text-left' : 'flex-shrink-0',
              )}
              asChild
            >
              <Link to={to} className="flex items-center gap-2">
                {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
                {tab.label}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
