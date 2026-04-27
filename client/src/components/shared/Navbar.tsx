import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { UserProfileDropdown } from './UserProfileDropdown';
import { Breadcrumbs } from './Breadcrumbs';
import { DashboardGreeting } from './DashboardGreeting';
import { SidebarContent } from './SidebarContent';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const isDesktop = useBreakpoint('lg');
  const location = useLocation();

  // Check if we are on the dashboard index page.
  // The path could be "/:slug" (length 1) or "/" (length 0).
  // We exclude common auth paths that might also have length 1.
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isDashboard =
    pathParts.length === 0 ||
    (pathParts.length === 1 &&
      !['login', 'register', 'select-organization', 'onboarding'].includes(pathParts[0]));

  return (
    <header className="sticky top-0 z-50 h-16 shrink-0 bg-background/80 backdrop-blur-xs flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 lg:gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Access different sections of the ERP application.</SheetDescription>
            </SheetHeader>
            <SidebarContent isCollapsed={false} onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="hidden lg:flex">
          {isDashboard ? <DashboardGreeting /> : <Breadcrumbs />}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <GlobalSearch />
        <NotificationBell />
        {isDesktop && (
          <>
            <div className="h-4 w-px bg-border mx-0.5 lg:mx-1" />
            <ThemeToggle variant="compact" />
          </>
        )}
        <UserProfileDropdown />
      </div>
    </header>
  );
}
