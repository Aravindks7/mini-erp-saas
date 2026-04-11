import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3">
        <GlobalSearch />
        <NotificationBell />
        <div className="h-4 w-px bg-border mx-1" />
        <ThemeToggle variant="compact" />
      </div>
    </header>
  );
}
