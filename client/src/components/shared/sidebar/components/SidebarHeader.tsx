import { SidebarClose, SidebarOpen } from 'lucide-react';
import { OrganizationSwitcher } from '../../OrganizationSwitcher';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  toggle: () => void;
}

export function SidebarHeader({ isCollapsed, toggle }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-6 font-semibold text-lg',
        isCollapsed && 'flex-col justify-center px-2 gap-4',
      )}
    >
      <div className={cn('min-w-0', !isCollapsed && 'flex-1')}>
        <OrganizationSwitcher isCollapsed={isCollapsed} />
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={toggle}
        className="hidden lg:flex shrink-0 h-8 w-8"
      >
        {isCollapsed ? <SidebarOpen size={14} /> : <SidebarClose size={14} />}
      </Button>
    </div>
  );
}
