import { useState } from 'react';
import { Building2, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import { CreateOrganizationDialog } from '@/features/organizations/components/CreateOrganizationDialog';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface OrganizationSwitcherProps {
  isCollapsed?: boolean;
}

/**
 * OrganizationSwitcher Component
 *
 * Handles switching between different organizations/tenants.
 * Uses hard navigation (window.location.href) on switch to guarantee
 * complete cache clearance and 100% data isolation.
 *
 * Refactored to use shadcn/ui DropdownMenu for better accessibility and
 * responsive behavior.
 */
export function OrganizationSwitcher({ isCollapsed }: OrganizationSwitcherProps) {
  const { activeOrganizationId, syncActiveOrganizationId } = useTenant();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isDesktop = useBreakpoint('lg');

  const { data: organizations, isLoading } = useOrganizations();
  const activeOrg = organizations?.find((org) => org.id === activeOrganizationId);

  const handleOrgSwitch = (orgId: string, slug: string) => {
    if (orgId === activeOrganizationId) return;

    // 1. Sync the ID immediately to avoid x-organization-id header mismatch in next fetch
    syncActiveOrganizationId(orgId);

    // 2. Hard navigate to the new slug's dashboard to clear all memory caches (QueryClient, etc)
    // and guarantee 100% data isolation between tenants.
    window.location.assign(`/${slug}`);
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'h-12 w-full animate-pulse rounded-lg bg-muted/50',
          isCollapsed && 'h-10 w-10 mx-auto',
        )}
      />
    );
  }

  const trigger = (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        className={cn(
          'h-12 w-full justify-start gap-3 px-2 transition-all hover:bg-accent/50 focus-visible:ring-0 active:scale-[0.98]',
          isCollapsed && 'h-10 w-10 justify-center p-0 mx-auto',
        )}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all',
            isCollapsed && 'h-9 w-9',
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0 text-left">
            <span className="truncate w-full text-sm font-semibold leading-none">
              {activeOrg?.name || 'Select Organization'}
            </span>
            <span className="truncate w-full text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Enterprise Plan
            </span>
          </div>
        )}
        {!isCollapsed && (
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
        )}
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <>
      <DropdownMenu>
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

        <DropdownMenuContent
          className={cn('', isDesktop && 'w-64')}
          align={isCollapsed ? 'start' : 'center'}
          side={isCollapsed ? 'right' : 'bottom'}
          sideOffset={isCollapsed ? 12 : 4}
        >
          <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Organizations
          </DropdownMenuLabel>
          <DropdownMenuGroup className="px-1">
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => handleOrgSwitch(org.id, org.slug)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md py-2 transition-colors focus:bg-accent',
                  org.id === activeOrganizationId &&
                    'bg-accent/50 font-medium text-accent-foreground',
                )}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{org.name}</span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {org.slug}.erpsaas.com
                  </span>
                </div>
                {org.id === activeOrganizationId && (
                  <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="mx-1 my-1" />
          <div className="px-1">
            <DropdownMenuItem
              onSelect={() => setIsCreateDialogOpen(true)}
              className="cursor-pointer gap-2 py-2 text-primary focus:bg-primary/5 focus:text-primary"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5">
                <Plus size={14} />
              </div>
              <span className="text-sm font-medium">Create Organization</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateOrganizationDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </>
  );
}
