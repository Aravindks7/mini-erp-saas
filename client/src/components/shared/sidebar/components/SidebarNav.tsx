import { cn } from '@/lib/utils';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarGroup } from './SidebarGroup';
import { SidebarHoverGroup } from './SidebarHoverGroup';
import type { SidebarTree } from '@/lib/navigation-utils';

interface SidebarNavProps {
  tree: SidebarTree;
  isCollapsed: boolean;
  pathname: string;
  searchQuery: string;
  onNavigate: (path: string) => void;
  onItemClick?: () => void;
}

export function SidebarNav({
  tree,
  isCollapsed,
  pathname,
  searchQuery,
  onNavigate,
  onItemClick,
}: SidebarNavProps) {
  return (
    <nav
      className={cn(
        'flex-1 space-y-2 px-4 py-12 lg:py-4 overflow-y-auto scrollbar-none',
        isCollapsed && 'lg:px-2 flex flex-col items-center',
      )}
    >
      {/* Top ungrouped items */}
      {tree.ungroupedTop.map((item) => (
        <SidebarNavItem
          key={item.path}
          to={item.path}
          icon={item.route.handle?.icon}
          label={item.route.handle?.title || ''}
          isCollapsed={isCollapsed}
          isActive={item.isActive}
          onClick={onItemClick}
        />
      ))}

      {/* Module Groups */}
      {tree.groups.map((group) =>
        isCollapsed ? (
          <SidebarHoverGroup
            key={group.id}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
            onItemClick={onItemClick}
          />
        ) : (
          <SidebarGroup
            key={group.id}
            group={group}
            pathname={pathname}
            onNavigate={onNavigate}
            onItemClick={onItemClick}
            forceOpen={searchQuery.length > 0}
          />
        ),
      )}

      {/* Bottom ungrouped items */}
      {tree.ungroupedBottom.map((item) => (
        <SidebarNavItem
          key={item.path}
          to={item.path}
          icon={item.route.handle?.icon}
          label={item.route.handle?.title || ''}
          isCollapsed={isCollapsed}
          isActive={item.isActive}
          onClick={onItemClick}
        />
      ))}
    </nav>
  );
}
