import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarGroupData } from '@/lib/navigation-utils';

interface SidebarGroupProps {
  group: SidebarGroupData;
  onItemClick?: () => void;
  forceOpen?: boolean;
}

export function SidebarGroup({ group, onItemClick, forceOpen }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`sidebar-group-${group.id}`);
    if (saved !== null) return saved === 'true';
    return group.isActive;
  });

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

  const Icon = group.icon;
  const isExpanded = forceOpen || isOpen;

  return (
    <div className="space-y-1">
      <button
        onClick={toggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition-colors',
          group.isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="shrink-0" />}
          <span className="truncate">{group.name}</span>
        </div>
        <ChevronRight
          size={16}
          className={cn(
            'transition-transform duration-200 ease-in-out shrink-0',
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
          <div className="relative ml-3 pl-3">
            {group.items.map((item, index) => {
              const ItemIcon = item.route.handle?.icon;
              const isLast = index === group.items.length - 1;

              return (
                <div key={item.path} className="relative py-0.5">
                  {/* 
                    Continuous SVG Connector:
                    - By removing parent space-y and using py-0.5 here,
                      h-full now covers the entire vertical gap.
                  */}
                  <svg
                    className="pointer-events-none absolute -left-3 top-0 w-3 h-full"
                    viewBox="0 0 12 44"
                    preserveAspectRatio="none"
                  >
                    <path
                      d={isLast ? 'M 0 0 V 14 Q 0 26 10 26' : 'M 0 0 V 44 M 0 14 Q 0 26 10 26'}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-border"
                    />
                  </svg>

                  <NavLink
                    to={item.path}
                    onClick={onItemClick}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-200',
                      item.isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground font-medium',
                    )}
                  >
                    {ItemIcon && <ItemIcon size={15} className="shrink-0 opacity-70" />}
                    <span className="truncate">{item.route.handle?.title}</span>
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
