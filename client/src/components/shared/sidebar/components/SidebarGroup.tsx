import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarGroupData } from '@/lib/navigation-utils';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarGroupProps {
  group: SidebarGroupData;
  pathname: string;
  onItemClick?: () => void;
  onNavigate: (path: string) => void;
  forceOpen?: boolean;
}

export function SidebarGroup({
  group,
  pathname,
  onItemClick,
  onNavigate,
  forceOpen,
}: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`sidebar-group-${group.id}`);
    if (saved !== null) return saved === 'true';
    return group.isActive;
  });

  // Keep internal state in sync with active route changes
  const [prevIsActive, setPrevIsActive] = useState(group.isActive);

  if (group.isActive && !prevIsActive) {
    setPrevIsActive(true);
    if (!isOpen) {
      setIsOpen(true);
      localStorage.setItem(`sidebar-group-${group.id}`, 'true');
    }
  } else if (!group.isActive && prevIsActive) {
    setPrevIsActive(false);
  }

  const toggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    localStorage.setItem(`sidebar-group-${group.id}`, String(nextState));
  };

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!group.indexPath) {
      toggle();
      return;
    }

    if (pathname === group.indexPath) {
      toggle();
    } else {
      onNavigate(group.indexPath);
      if (!isOpen) {
        setIsOpen(true);
        localStorage.setItem(`sidebar-group-${group.id}`, 'true');
      }
    }
  };

  const Icon = group.icon;
  const isExpanded = forceOpen || isOpen;
  const isExactlyOnIndex = pathname === group.indexPath;

  return (
    <div className="space-y-1">
      <button
        onClick={handleHeaderClick}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200',
          group.isActive
            ? 'text-primary bg-primary/5'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          isExactlyOnIndex && 'bg-primary/10',
        )}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon
              size={18}
              className={cn(
                'shrink-0 transition-colors',
                group.isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          )}
          <span className="truncate">{group.name}</span>
        </div>
        <ChevronRight
          size={16}
          className={cn(
            'transition-transform duration-200 ease-in-out shrink-0 opacity-70',
            isExpanded && 'rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="relative ml-3 pl-5">
            {group.items.map((item, index) => {
              const isLast = index === group.items.length - 1;

              return (
                <div key={item.path} className="relative py-0.5 pr-0.5">
                  <svg
                    className="pointer-events-none absolute -left-3 top-0 w-3 h-full"
                    viewBox="0 0 12 50"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={isLast ? 'M 0 0 V 26 Q 0 26 10 26' : 'M 0 0 V 50 M 0 26 Q 0 26 10 26'}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-border"
                    />
                  </svg>

                  <SidebarNavItem
                    to={item.path}
                    icon={item.route.handle?.icon}
                    label={item.route.handle?.title || ''}
                    isActive={item.isActive}
                    onClick={onItemClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
