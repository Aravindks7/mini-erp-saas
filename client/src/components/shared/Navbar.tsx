import { Button } from '@/components/ui/button';
import { Bell, LogOut, User } from 'lucide-react';
import { OrganizationSwitcher } from '@/components/ui/OrganizationSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/auth-client';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth-session';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { data: session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: handleSignOut } = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: async () => {
      // Clear session from cache and navigate to login
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      navigate('/login');
    },
  });

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher />
        <div className="h-4 w-px bg-border mx-2" />
        <h1 className="text-sm font-medium text-muted-foreground">ERP System</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell size={18} />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end mr-1">
            <span className="text-xs font-semibold">{session?.user?.name || 'User'}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {session?.user?.email}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <User size={16} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSignOut()}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
