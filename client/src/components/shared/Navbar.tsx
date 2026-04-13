import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';
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

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
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
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <GlobalSearch />
        <NotificationBell />
        <div className="h-4 w-px bg-border mx-0.5 lg:mx-1" />
        <ThemeToggle variant="compact" />
      </div>
    </header>
  );
}
