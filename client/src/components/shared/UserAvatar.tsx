import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';

interface UserAvatarProps {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  className?: string;
  fallbackClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
}

const SIZE_MAP = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
  xl: 'size-12',
  custom: '',
};

const TEXT_SIZE_MAP = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
  custom: '',
};

export function UserAvatar({ user, className, fallbackClassName, size = 'md' }: UserAvatarProps) {
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null;

  return (
    <Avatar className={cn(SIZE_MAP[size], 'border-2 border-background shadow-sm', className)}>
      <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
      <AvatarFallback
        className={cn(
          'bg-primary/5 text-primary font-semibold',
          TEXT_SIZE_MAP[size],
          fallbackClassName,
        )}
      >
        {initials || <UserIcon className="size-1/2 opacity-40" />}
      </AvatarFallback>
    </Avatar>
  );
}
