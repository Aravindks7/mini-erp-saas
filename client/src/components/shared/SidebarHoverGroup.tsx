import { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { SidebarGroupData } from '@/lib/navigation-utils';

interface SidebarHoverGroupProps {
  group: SidebarGroupData;
  onItemClick?: () => void;
}

export function SidebarHoverGroup({ group, onItemClick }: SidebarHoverGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const Icon = group.icon;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const content = (
    <div
      className="flex flex-col space-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="px-3 py-2 text-sm font-bold text-foreground border-b mb-1">{group.name}</div>
      {group.items.map((item) => {
        const ItemIcon = item.route.handle?.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              setIsOpen(false);
              onItemClick?.();
            }}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200',
              item.isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted font-medium',
            )}
          >
            {ItemIcon && <ItemIcon size={16} className="shrink-0" />}
            <span className="truncate">{item.route.handle?.title}</span>
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
            group.isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {Icon && <Icon size={18} />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        sideOffset={14}
        align="start"
        className="p-2 max-w-48"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
