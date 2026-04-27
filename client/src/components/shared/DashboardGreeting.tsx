import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

/**
 * Component to display a personalized greeting on the Dashboard.
 * Logic: Determine time-of-day greeting (Morning/Afternoon/Evening).
 * Context: Fetches the authenticated user's name from AuthContext.
 */
export function DashboardGreeting() {
  const { data: session } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (!session?.user) return null;

  const firstName = session.user.name.split(' ')[0];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {greeting}, {firstName}!
      </h1>
    </div>
  );
}
