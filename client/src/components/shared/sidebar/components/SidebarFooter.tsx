import { Settings, LogOut, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarNavItem } from './SidebarNavItem';
import { useLocation } from 'react-router-dom';

interface SidebarFooterProps {
  isCollapsed: boolean;
  systemPaths: {
    activity: string;
    settings: string;
  };
  onLogout: () => void;
}

export function SidebarFooter({ isCollapsed, systemPaths, onLogout }: SidebarFooterProps) {
  const { pathname } = useLocation();

  return (
    <div className={cn('mt-auto border-t border-border/50 p-3 space-y-1', isCollapsed && 'p-2')}>
      <SidebarNavItem
        to={systemPaths.activity}
        icon={Activity}
        label="Activity"
        isCollapsed={isCollapsed}
        isActive={pathname.startsWith(systemPaths.activity)}
      />

      <SidebarNavItem
        to={systemPaths.settings}
        icon={Settings}
        label="Settings"
        isCollapsed={isCollapsed}
        isActive={pathname.startsWith(systemPaths.settings)}
      />

      <button
        onClick={onLogout}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-destructive hover:bg-destructive/10 font-medium',
          isCollapsed ? 'justify-center px-0 w-10 h-10' : 'w-full',
        )}
      >
        <LogOut size={18} className="shrink-0" />
        {!isCollapsed && <span className="truncate">Logout</span>}
      </button>
    </div>
  );
}
