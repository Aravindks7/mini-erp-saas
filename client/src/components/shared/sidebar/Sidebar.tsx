import { useSidebarData } from './hooks/useSidebarData';
import { SidebarView } from './SidebarView';

/**
 * Sidebar Container
 * Orchestrates all sidebar-related logic, state, and data fetching.
 * Follows the Smart/Dumb component pattern for maximum decoupling.
 */
interface SidebarProps {
  onItemClick?: () => void;
  isCollapsed?: boolean;
}

export default function Sidebar({ onItemClick, isCollapsed: isCollapsedOverride }: SidebarProps) {
  const sidebarData = useSidebarData();

  return (
    <SidebarView
      {...sidebarData}
      onItemClick={onItemClick}
      isCollapsed={isCollapsedOverride ?? sidebarData.isCollapsed}
    />
  );
}
