import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserDisplayProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Standard User Display for ERP SaaS.
 * Clinical presentation of team members, managers, or customers.
 */
export function UserDisplay({ name, email, avatarUrl, className, size = 'md' }: UserDisplayProps) {
  const sizeMap = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar className={cn('border border-border/40 bg-muted', sizeMap[size])}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="bg-primary/5 text-primary/80 font-semibold tracking-tight">
          {initials}
        </AvatarFallback>
      </Avatar>
      {(name || email) && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground tracking-tight truncate leading-tight">
            {name}
          </span>
          {email && (
            <span className="text-[11px] text-muted-foreground truncate leading-none mt-1">
              {email}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
