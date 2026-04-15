import { useState } from 'react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { UpdateOrganizationForm } from './UpdateOrganizationForm';
import { useTenant } from '@/contexts/TenantContext';
import { useMembers, useInvitations, useDeleteOrganization } from '../hooks/organizations.hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { Users, Mail, Calendar, Building2, Trash2, AlertCircle } from 'lucide-react';
import { formatDate } from '@shared/utils/date';

export function OrgProfileTab() {
  const { activeOrganization, activeOrganizationId, syncActiveOrganizationId } = useTenant();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: members, isLoading: isLoadingMembers } = useMembers(activeOrganizationId || '');
  const { data: invitations, isLoading: isLoadingInvites } = useInvitations(
    activeOrganizationId || '',
  );

  const deleteOrg = useDeleteOrganization();

  const handleDelete = async () => {
    try {
      await deleteOrg.mutateAsync(activeOrganizationId || '');
      toast.success('Organization deleted successfully');
      syncActiveOrganizationId(null);
      window.location.assign('/');
    } catch {
      toast.error('Failed to delete organization');
    }
  };

  const stats = [
    {
      label: 'Active Members',
      value: members?.length || 0,
      icon: <Users className="h-4 w-4 text-primary" />,
      loading: isLoadingMembers,
    },
    {
      label: 'Pending Invites',
      value: invitations?.filter((i) => i.status === 'pending').length || 0,
      icon: <Mail className="h-4 w-4 text-warning" />,
      loading: isLoadingInvites,
    },
  ];

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <UpdateOrganizationForm />

          {/* Danger Zone */}
          <Card className="border-destructive/20 bg-destructive/1">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle className="text-lg">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible actions for this organization. Please proceed with extreme caution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-destructive/10 bg-destructive/1">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Delete this organization</h4>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Once deleted, all data including members, customers, orders, and settings will
                    be permanently removed. This action cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Organization Summary</CardTitle>
                  <CardDescription>Snapshot of your workspace personnel.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="p-3 rounded-xl border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      {stat.icon}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </span>
                    </div>
                    {stat.loading ? (
                      <div className="h-7 w-12 animate-pulse bg-muted rounded mt-1" />
                    ) : (
                      <div className="text-2xl font-bold">{stat.value}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created on</span>
                  </div>
                  <span className="font-medium">
                    {activeOrganization ? formatDate(activeOrganization.createdAt) : '...'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>Region</span>
                  </div>
                  <span className="font-medium">{activeOrganization?.defaultCountry}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/2 border-primary/10 border-dashed">
            <CardContent className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-1">Workspace Logo</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Upload your company brand to customize your ERP environment.
              </p>
              <div className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 py-1 px-2 rounded inline-block">
                Coming Soon
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteOrg.isPending}
        entityType="Organization"
        entityName={activeOrganization?.name}
        requireConfirmationText={activeOrganization?.name}
        confirmLabel="Permanently Delete Organization"
        title="Delete Organization?"
        description={`This will permanently delete the organization "${activeOrganization?.name}" and all associated business data. This action is irreversible.`}
      />
    </PageContainer>
  );
}
