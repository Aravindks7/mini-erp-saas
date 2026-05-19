import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { SidebarGroupData } from '@/lib/navigation-utils';
import { SidebarNavItem } from './SidebarNavItem';

interface SidebarHoverGroupProps {
  group: SidebarGroupData;
  pathname: string;
  onItemClick?: () => void;
  onNavigate: (path: string) => void;
}

export function SidebarHoverGroup({
  group,
  pathname,
  onItemClick,
  onNavigate,
}: SidebarHoverGroupProps) {
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (group.indexPath && pathname !== group.indexPath) {
      onNavigate(group.indexPath);
      onItemClick?.();
      setIsOpen(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const isExactlyOnIndex = pathname === group.indexPath;

  const content = (
    <div
      className="flex flex-col space-y-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="px-3 py-2 text-sm font-bold text-foreground border-b mb-1">{group.name}</div>
      {group.items.map((item) => (
        <SidebarNavItem
          key={item.path}
          to={item.path}
          icon={item.route.handle?.icon}
          label={item.route.handle?.title || ''}
          isActive={item.isActive}
          onClick={() => {
            setIsOpen(false);
            onItemClick?.();
          }}
        />
      ))}
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200',
            group.isActive
              ? 'bg-primary/10 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            isExactlyOnIndex && 'bg-primary/20',
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
