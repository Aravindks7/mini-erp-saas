import { Bell, Check, Info, AlertTriangle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
}

interface NotificationBellProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onViewAll?: () => void;
  className?: string;
}

// Mock data for demonstration
const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New Customer Registered',
    description: 'Acme Corp has been added to the system.',
    type: 'success',
    timestamp: '2 mins ago',
    isRead: false,
  },
  {
    id: '2',
    title: 'Inventory Alert',
    description: 'Product "Steel Rods" is below safety stock level.',
    type: 'warning',
    timestamp: '1 hour ago',
    isRead: false,
  },
  {
    id: '3',
    title: 'Server Maintenance',
    description: 'Scheduled maintenance tonight at 10 PM UTC.',
    type: 'info',
    timestamp: '3 hours ago',
    isRead: true,
  },
];

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

export function NotificationBell({
  notifications = DEFAULT_NOTIFICATIONS,
  onMarkAsRead,
  onMarkAllAsRead,
  onViewAll,
  className,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200',
            className,
          )}
        >
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary p-0 text-[9px] font-bold text-primary-foreground ring-2 ring-background animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[340px] sm:w-[380px] p-0 shadow-2xl border-border/40 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 overflow-hidden rounded-xl"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-5 py-4 bg-background border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 rounded-md text-xs font-medium">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-primary hover:text-primary/80 hover:bg-transparent transition-colors"
              onClick={onMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin py-1">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 px-5 py-4 cursor-pointer transition-all duration-200 outline-none',
                  notification.isRead
                    ? 'focus:bg-muted/40 hover:bg-muted/40'
                    : 'bg-primary/2 focus:bg-primary/6 hover:bg-primary/6',
                )}
                onClick={() => onMarkAsRead?.(notification.id)}
              >
                <div
                  className={cn(
                    'mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors',
                    notification.isRead
                      ? 'bg-background border-border/50'
                      : 'bg-background border-primary/20 ring-1 ring-primary/10',
                  )}
                >
                  <NotificationIcon type={notification.type} />
                </div>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium leading-none truncate',
                        !notification.isRead ? 'text-foreground' : 'text-foreground/80',
                      )}
                    >
                      {notification.title}
                    </p>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                      {notification.timestamp}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-xs leading-relaxed line-clamp-2',
                      notification.isRead ? 'text-muted-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {notification.description}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">You have no new notifications.</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-2 border-t border-border/40 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors h-9 rounded-lg"
            onClick={onViewAll}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
