import { NavLink, useLocation } from 'react-router-dom';
import { SidebarClose, SidebarOpen, Settings, LogOut } from 'lucide-react';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { dashboardRoutes } from '@/lib/router-registry';
import { useTenant } from '@/contexts/TenantContext';
import { buildSidebarTree, type SidebarItem } from '@/lib/navigation-utils';
import { SidebarGroup } from './SidebarGroup';
import { SidebarHoverGroup } from './SidebarHoverGroup';
import { Search } from 'lucide-react';
import { useSignOutMutation } from '@/features/auth/hooks/auth.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';
import { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface SidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
  toggle?: () => void;
}

export function SidebarContent({ onItemClick, isCollapsed, toggle }: SidebarContentProps) {
  const { pathname } = useLocation();
  const { activeOrganization } = useTenant();
  const { getPath } = useTenantPath();
  const { mutate: handleSignOut } = useSignOutMutation();
  const [searchQuery, setSearchQuery] = useState('');
  const isDesktop = useBreakpoint('lg');
  const slug = activeOrganization?.slug;

  const tree = buildSidebarTree(dashboardRoutes, pathname, slug);

  // Filter tree based on local search query
  const filteredTree = {
    ...tree,
    ungroupedTop: tree.ungroupedTop.filter((item) =>
      item.route.handle?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    ungroupedBottom: tree.ungroupedBottom.filter((item) =>
      item.route.handle?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
    groups: tree.groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.route.handle?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((group) => group.items.length > 0),
  };

  const renderSingleItem = (item: SidebarItem) => {
    const Icon = item.route.handle?.icon;

    const link = (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onItemClick}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
          isCollapsed ? 'justify-center px-0 w-10 h-10' : 'w-full',
          item.isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted font-medium',
        )}
      >
        {Icon && <Icon size={18} className="shrink-0" />}
        {!isCollapsed && <span className="truncate">{item.route.handle?.title}</span>}
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={10} className="font-semibold">
            {item.route.handle?.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  return (
    <div className={cn('flex flex-col h-full bg-background overflow-hidden', !isDesktop && 'pt-8')}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-6 font-semibold text-lg',
          isCollapsed && 'flex-col justify-center px-2 gap-4',
        )}
      >
        <div className={cn('min-w-0', !isCollapsed && 'flex-1')}>
          <OrganizationSwitcher isCollapsed={isCollapsed} />
        </div>

        <Button variant="outline" size="icon" onClick={toggle} className="hidden lg:flex shrink-0">
          {isCollapsed ? <SidebarOpen size={14} /> : <SidebarClose size={14} />}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="px-4 mb-4 relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/40 border border-border/50 text-sm font-normal text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      )}

      <nav
        className={cn(
          'flex-1 space-y-2 px-4 py-12 lg:py-4 overflow-y-auto scrollbar-none',
          isCollapsed && 'lg:px-2 flex flex-col items-center',
        )}
      >
        {filteredTree.ungroupedTop.map(renderSingleItem)}

        {filteredTree.groups.map((group) =>
          isCollapsed ? (
            <SidebarHoverGroup key={group.id} group={group} onItemClick={onItemClick} />
          ) : (
            <SidebarGroup
              key={group.id}
              group={group}
              onItemClick={onItemClick}
              forceOpen={searchQuery.length > 0}
            />
          ),
        )}

        {filteredTree.ungroupedBottom.map(renderSingleItem)}
      </nav>

      <div className={cn('mt-auto border-t border-border/50 p-3 space-y-1', isCollapsed && 'p-2')}>
        {/* Settings Button */}
        {(() => {
          const settingsPath = getPath('/settings');
          const isActive = pathname.startsWith(settingsPath);
          const link = (
            <NavLink
              to={settingsPath}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                isCollapsed ? 'justify-center px-0 w-10 h-10' : 'w-full',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:bg-muted font-medium',
              )}
            >
              <Settings size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Settings</span>}
            </NavLink>
          );

          return isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="font-semibold">
                Settings
              </TooltipContent>
            </Tooltip>
          ) : (
            link
          );
        })()}

        {/* Logout Button */}
        {(() => {
          const button = (
            <button
              onClick={() => handleSignOut()}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-destructive hover:bg-destructive/10 font-medium',
                isCollapsed ? 'justify-center px-0 w-10 h-10' : 'w-full',
              )}
            >
              <LogOut size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Logout</span>}
            </button>
          );

          return isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="font-semibold">
                Logout
              </TooltipContent>
            </Tooltip>
          ) : (
            button
          );
        })()}
      </div>
    </div>
  );
}
