import * as React from 'react';
import {
  Search,
  Command as CommandIcon,
  LayoutDashboard,
  Users,
  Settings,
  Package,
  ShoppingCart,
  History,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useModifierKey } from '@/hooks/useModifierKey';
import { useTenantPath } from '@/hooks/useTenantPath';

interface GlobalSearchProps {
  className?: string;
  onSearch?: (query: string) => void;
}

// Mock Data for "Recent Searches"
const RECENT_SEARCHES = [
  'Inventory Steel Rods',
  'Sales Order #1234',
  'Acme Corp Customer',
  'Supplier Invoices',
];

// Suggested Navigation Pages
const SUGGESTED_PAGES = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart, path: '/sales-orders' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export function GlobalSearch({ className, onSearch }: GlobalSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const modifierKey = useModifierKey();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(getPath(path));
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-9 justify-center p-0 lg:w-64 xl:w-[420px] lg:justify-start lg:gap-2 lg:rounded-lg lg:px-3 bg-muted/40 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground transition-colors border-border/50',
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0 opacity-40" />
        <span className="hidden lg:inline flex-1 text-left">Search anything...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 font-mono text-[10px] font-semibold text-muted-foreground xl:flex">
          <span className="text-[11px] leading-none">{modifierKey}</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} className="sm:max-w-2xl">
        <Command className="border-none shadow-none bg-transparent **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-muted-foreground/60 **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2">
          <CommandInput
            placeholder="Search items, pages, or commands..."
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              onSearch?.(v);
            }}
            className="h-12 text-sm px-4"
          />
          <CommandList className="max-h-[500px] px-2 py-2">
            <CommandEmpty className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try searching for pages, customers, or orders.
              </p>
            </CommandEmpty>

            {query === '' ? (
              <>
                <CommandGroup heading="Recent Searches">
                  {RECENT_SEARCHES.map((item) => (
                    <CommandItem
                      key={item}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                        <History className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator className="my-1" />
                <CommandGroup heading="Quick Pages">
                  {SUGGESTED_PAGES.map((page) => (
                    <CommandItem
                      key={page.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                      onSelect={() => handleSelect(page.path)}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                        <page.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{page.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : (
              <>
                <CommandGroup heading="Results">
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      navigate(getPath(`/search?q=${query}`));
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-primary/10">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">
                      Search for &ldquo;{query}&rdquo; in all modules...
                    </span>
                  </CommandItem>
                  {SUGGESTED_PAGES.filter((p) =>
                    p.label.toLowerCase().includes(query.toLowerCase()),
                  ).map((page) => (
                    <CommandItem
                      key={page.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                      onSelect={() => handleSelect(page.path)}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                        <page.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">{page.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                        Page
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator className="my-1" />
            <CommandGroup heading="Settings & Help">
              <CommandItem
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer"
                onSelect={() => handleSelect('/settings')}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm">Account Settings</span>
              </CommandItem>
              <CommandItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                  <CommandIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-sm">Keyboard Shortcuts</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  Shift+?
                </kbd>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
