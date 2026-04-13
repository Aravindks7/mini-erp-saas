import { NavLink, useLocation } from 'react-router-dom';
import { SidebarClose, SidebarOpen } from 'lucide-react';
import { UserProfileDropdown } from './UserProfileDropdown';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Button } from '../ui/button';
import { dashboardRoutes } from '@/lib/router-registry';

interface SidebarContentProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
  toggle?: () => void;
}

export function SidebarContent({ onItemClick, isCollapsed, toggle }: SidebarContentProps) {
  const { pathname } = useLocation();

  const sidebarItems = dashboardRoutes
    .filter((route) => route.handle?.showInSidebar)
    .map((route) => {
      const path = route.index ? '/' : `/${route.path}`;
      const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);

      return {
        path,
        title: route.handle!.title,
        icon: route.handle!.icon!,
        isActive,
      };
    });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div
        className={cn(
          'hidden lg:flex items-center gap-2 px-4 py-6 font-semibold text-lg',
          isCollapsed && '',
        )}
      >
        {!isCollapsed && <OrganizationSwitcher isCollapsed={isCollapsed} />}

        <Button variant="outline" size="icon" onClick={toggle}>
          {isCollapsed ? <SidebarOpen size={14} /> : <SidebarClose size={14} />}
        </Button>
      </div>

      <nav
        className={cn(
          'flex-1 space-y-2 px-4 py-12 lg:py-4 overflow-y-auto scrollbar-none',
          isCollapsed && 'lg:px-2 flex flex-col items-center',
        )}
      >
        {sidebarItems.map((item) => {
          const Icon = item.icon;

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
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="font-semibold">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      <UserProfileDropdown isCollapsed={isCollapsed} />
    </div>
  );
}
