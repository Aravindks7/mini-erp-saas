import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Building2, Plus, ArrowRight } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function SelectOrganizationPage() {
  const { setActiveOrganizationId } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ['my-organizations'],
    queryFn: () => apiFetch('/organizations'),
  });

  const handleSelectOrganization = (id: string) => {
    setActiveOrganizationId(id);
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-sm text-zinc-500 animate-pulse">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
            Select Organization
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Choose a workspace to continue your work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
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

          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-2 border-primary/20 hover:border-primary/50 text-primary"
            >
              <Plus className="h-4 w-4" />
              Create New Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
