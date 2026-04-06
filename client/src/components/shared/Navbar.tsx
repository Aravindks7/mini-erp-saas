import { OrganizationSwitcher } from './OrganizationSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';

export default function Navbar() {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <OrganizationSwitcher />
        <div className="h-4 w-px bg-border mx-2" />
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="h-4 w-px bg-border mx-1" />
        <ThemeToggle variant="compact" />
      </div>
    </header>
  );
}
