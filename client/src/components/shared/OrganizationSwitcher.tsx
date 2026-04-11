import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronsUpDown } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import { Button } from '../ui/button';

export function OrganizationSwitcher() {
  const { activeOrganizationId, setActiveOrganizationId } = useTenant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: organizations, isLoading } = useOrganizations();

  const activeOrg = organizations?.find((org) => org.id === activeOrganizationId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-muted/50" />;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full justify-between gap-2 active:translate-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{activeOrg?.name || 'Select Organization'}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Organizations
          </div>
          <div className="grid gap-1">
            {organizations?.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrganizationId(org.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  org.id === activeOrganizationId ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{org.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-1 border-t p-1">
            <button
              onClick={() => {
                // Future: link to create organization module
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              + Create Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
