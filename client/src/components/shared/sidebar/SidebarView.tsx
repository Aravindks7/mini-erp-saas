import { cn } from '@/lib/utils';
import { SidebarHeader } from './components/SidebarHeader';
import { SidebarSearch } from './components/SidebarSearch';
import { SidebarNav } from './components/SidebarNav';
import { SidebarFooter } from './components/SidebarFooter';
import type { SidebarData } from './hooks/useSidebarData';
import { useNavigate } from 'react-router-dom';

interface SidebarViewProps extends SidebarData {
  onItemClick?: () => void;
}

export function SidebarView({
  pathname,
  isCollapsed,
  toggle,
  isDesktop,
  searchQuery,
  setSearchQuery,
  filteredTree,
  handleSignOut,
  isLoggingOut,
  systemPaths,
  onItemClick,
}: SidebarViewProps) {
  const navigate = useNavigate();

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-xl border shadow-2xl scale-110 animate-in zoom-in-95">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="text-sm font-semibold text-foreground tracking-tight">
              Signing you out...
            </div>
          </div>
        </div>
      )}
      <aside
        className={cn(
          'hidden lg:flex bg-background flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative border-r',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn('flex flex-col h-full bg-background overflow-hidden', !isDesktop && 'pt-8')}
        >
          <SidebarHeader isCollapsed={isCollapsed} toggle={toggle} />

          <SidebarSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            isCollapsed={isCollapsed}
          />

          <SidebarNav
            tree={filteredTree}
            isCollapsed={isCollapsed}
            pathname={pathname}
            searchQuery={searchQuery}
            onNavigate={(path) => navigate(path)}
            onItemClick={onItemClick}
          />

          <SidebarFooter
            isCollapsed={isCollapsed}
            systemPaths={systemPaths}
            onLogout={() => handleSignOut()}
          />
        </div>
      </aside>
    </>
  );
}
