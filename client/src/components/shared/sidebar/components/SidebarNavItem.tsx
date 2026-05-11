import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  to: string;
  icon?: LucideIcon;
  label: string;
  isCollapsed?: boolean;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function SidebarNavItem({
  to,
  icon: Icon,
  label,
  isCollapsed,
  isActive,
  onClick,
  className,
  variant = 'default',
}: SidebarNavItemProps) {
  const content = (
    <NavLink
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        isCollapsed ? 'justify-center px-0 w-10 h-10' : 'w-full',
        variant === 'destructive'
          ? 'text-destructive hover:bg-destructive/10'
          : isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:bg-muted font-medium',
        className,
      )}
    >
      {Icon && <Icon size={18} className="shrink-0" />}
      {!isCollapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-semibold">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
