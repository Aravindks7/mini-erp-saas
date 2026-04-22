import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, ArrowRight, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateOrganizationDialog } from '@/features/organizations/components/CreateOrganizationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import AuthLayout from '@/components/shared/AuthLayout';

export default function SelectOrganization() {
  const navigate = useNavigate();
  const { data: organizations, isLoading, isError } = useOrganizations();
  const { syncActiveOrganizationId } = useTenant();
  const { data: session } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Redirect to onboarding if the user has no organizations and loading is finished.
  useEffect(() => {
    if (!isLoading && organizations && organizations.length === 0) {
      navigate('/onboarding');
    }
  }, [isLoading, organizations, navigate]);

  const handleSelect = (orgId: string, slug: string) => {
    syncActiveOrganizationId(orgId);
    toast.success('Switched organization');
    navigate(`/${slug}`);
  };

  if (isLoading) {
    return (
      <AuthLayout title="Loading organizations...">
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (isError) {
    return (
      <AuthLayout title="Error">
        <p className="text-center text-destructive">Failed to load organizations.</p>
        <Button onClick={() => window.location.reload()} className="mt-4 w-full">
          Retry
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back!"
      description={
        session?.user?.email
          ? `Signed in as ${session.user.email}`
          : 'Select an organization to continue'
      }
    >
      <div className="space-y-4">
        {organizations?.map((org) => (
          <Card
            key={org.id}
            className="group cursor-pointer hover:border-primary/50 transition-all active:scale-[0.98]"
            onClick={() => handleSelect(org.id, org.slug)}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <CardDescription className="text-xs">/{org.slug}</CardDescription>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                      <Shield className="mr-1 h-2.5 w-2.5" />
                      {org.roleName}
                    </Badge>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
            </CardHeader>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-14"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Organization
        </Button>
      </div>

      <CreateOrganizationDialog isOpen={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </AuthLayout>
  );
}
