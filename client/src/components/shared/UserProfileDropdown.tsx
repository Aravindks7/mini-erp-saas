import { User, UserPlus, Bell, MessageSquare, Activity, LogOut, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSignOutMutation } from '@/features/auth/hooks/auth.hooks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface UserProfileDropdownProps {
  className?: string;
  isCollapsed?: boolean;
}

export function UserProfileDropdown({ className, isCollapsed }: UserProfileDropdownProps) {
  const { data: session } = useAuth();
  const { mutate: handleSignOut } = useSignOutMutation();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className={cn('px-4 py-4 mt-auto border-t border-border/50', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 group text-left outline-none',
              isCollapsed && 'justify-center px-0',
            )}
          >
            <Avatar className="size-9 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
              <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {!isCollapsed && (
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate text-foreground/90">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-[11px] text-muted-foreground truncate font-medium">
                  {user?.email || 'user@example.com'}
                </span>
              </div>
            )}

            {!isCollapsed && (
              <ChevronUp
                size={16}
                className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
              />
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align={isCollapsed ? 'center' : 'start'}
          sideOffset={12}
          className="w-72 shadow-2xl rounded-2xl border-border/40 backdrop-blur-sm"
        >
          <DropdownMenuLabel className="p-3 font-normal">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar size="lg" className="size-12 border-2 border-background shadow-md">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold truncate tracking-tight text-foreground">
                    {user?.name || 'User Name'}
                  </span>
                  <span className="text-xs text-muted-foreground truncate font-medium">
                    {user?.email || 'user@example.com'}
                  </span>
                </div>
              </div>

              {/* Theme Toggle Section */}
              <div className="pt-1">
                <ThemeToggle variant="full" />
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-border/40 my-2" />

          <DropdownMenuGroup>
            <DropdownMenuItem className="py-2.5 px-3 rounded-xl cursor-pointer">
              <User size={18} className="mr-2 text-muted-foreground/80" />
              <span className="font-medium">My Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 px-3 rounded-xl cursor-pointer">
              <UserPlus size={18} className="mr-2 text-muted-foreground/80" />
              <span className="font-medium">Invite People</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 px-3 rounded-xl cursor-pointer">
              <Bell size={18} className="mr-2 text-muted-foreground/80" />
              <span className="font-medium">Notification Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border/40 my-2" />

          <DropdownMenuGroup>
            <DropdownMenuItem className="py-2.5 px-3 rounded-xl cursor-pointer">
              <MessageSquare size={18} className="mr-2 text-muted-foreground/80" />
              <span className="font-medium">Help Center</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2.5 px-3 rounded-xl cursor-pointer">
              <Activity size={18} className="mr-2 text-muted-foreground/80" />
              <span className="font-medium">Activity</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border/40 my-2" />

          <DropdownMenuItem
            className="py-2.5 px-3 rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => handleSignOut()}
          >
            <LogOut size={18} className="mr-2" />
            <span className="font-semibold">Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
