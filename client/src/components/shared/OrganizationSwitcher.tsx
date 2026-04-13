import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface OrganizationSwitcherProps {
  isCollapsed?: boolean;
}

export function OrganizationSwitcher({ isCollapsed }: OrganizationSwitcherProps) {
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
    return (
      <div
        className={cn(
          'h-10 w-full animate-pulse rounded-md bg-muted/50',
          isCollapsed && 'w-10 mx-auto',
        )}
      />
    );
  }

  const trigger = (
    <Button
      variant="ghost"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        'h-10 w-full justify-between gap-2 active:translate-none',
        isCollapsed && 'w-10 justify-center p-0 mx-auto',
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        {!isCollapsed && (
          <span className="truncate font-medium">{activeOrg?.name || 'Select Organization'}</span>
        )}
      </div>
      {!isCollapsed && (
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
      )}
    </Button>
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {isCollapsed ? (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right" sideOffset={10} className="font-semibold">
              {activeOrg?.name || 'Select Organization'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        trigger
      )}

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in zoom-in-95',
            isCollapsed && 'w-56 left-full ml-2 top-0 mt-0',
          )}
        >
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
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  org.id === activeOrganizationId ? 'bg-accent text-accent-foreground' : '',
                )}
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
              <Plus size={14} className="mr-1" />
              <span>Create</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
