import { SidebarContent } from './SidebarContent';
import { useSidebarCollapse } from '@/hooks/useSidebarCollapse';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const { isCollapsed, toggle } = useSidebarCollapse();

  return (
    <aside
      className={cn(
        'hidden lg:flex  bg-background flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-16' : 'w-64',
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} toggle={toggle} />
    </aside>
  );
}
