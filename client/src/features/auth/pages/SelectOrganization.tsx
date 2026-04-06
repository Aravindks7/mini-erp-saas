import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';

export default function SelectOrganizationPage() {
  const { setActiveOrganizationId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: organizations, isLoading } = useOrganizations();

  const handleSelectOrganization = (id: string) => {
    setActiveOrganizationId(id);
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  if (isLoading) {
    return (
      <CardContent className="p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <div className="text-sm text-muted-foreground animate-pulse font-medium">
            Loading workspaces...
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <>
      <CardContent className="space-y-4 p-6 pt-2">
        <div className="grid gap-3">
          {organizations && organizations.length > 0 ? (
            organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrganization(org.id)}
                className="group flex items-center justify-between rounded-lg border bg-card p-4 text-left transition-all hover:border-primary hover:bg-accent/50 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{org.name}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">
                      {org.role}
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))
          ) : (
            <div className="text-center py-6 px-4 rounded-lg border border-dashed text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">You don't have any organizations yet.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t p-6">
        <Button
          variant="outline"
          className="w-full h-12 flex items-center justify-center gap-3 border-primary/20 hover:border-primary/50 text-primary font-bold transition-all hover:bg-primary/5"
          onClick={() => navigate('/onboarding')}
        >
          <Plus className="h-5 w-5" />
          Create New Organization
        </Button>
      </CardFooter>
    </>
  );
}
