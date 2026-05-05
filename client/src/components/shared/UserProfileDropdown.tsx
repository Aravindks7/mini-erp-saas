import { User, UserPlus, Bell, MessageSquare, Activity, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTenantPath } from '@/hooks/useTenantPath';
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
import { UserAvatar } from './UserAvatar';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface UserProfileDropdownProps {
  className?: string;
}

export function UserProfileDropdown({ className }: UserProfileDropdownProps) {
  const { data: session } = useAuth();
  const { mutate: handleSignOut } = useSignOutMutation();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  const user = session?.user;

  return (
    <div className={cn('flex items-center', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200 outline-none">
            <UserAvatar user={user} size="md" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={12}
          className="w-72 shadow-2xl rounded-2xl border-border/40 backdrop-blur-sm"
        >
          <DropdownMenuLabel className="p-3 font-normal">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="lg" className="size-12 shadow-md" />
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
            <DropdownMenuItem
              className="py-2.5 px-3 rounded-xl cursor-pointer"
              onClick={() => navigate(getPath('/activity'))}
            >
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
