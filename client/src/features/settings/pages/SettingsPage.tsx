import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { RouteTabs } from '@/components/shared/RouteTabs';
import { Outlet, useLocation, Navigate, useParams } from 'react-router-dom';
import { Building2, Users, Mail } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useOrganizations } from '@/features/organizations/hooks/organizations.hooks';

const tabs = [
  { label: 'Profile', path: 'profile', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Members', path: 'members', icon: <Users className="h-4 w-4" /> },
  { label: 'Invitations', path: 'invites', icon: <Mail className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const { activeOrganizationId } = useTenant();
  const { slug } = useParams();
  const location = useLocation();
  const { data: organizations } = useOrganizations();

  // Determine admin status directly from the loaded organizations list to avoid
  // the sync delay of the 'activeOrganization' object in TenantContext.
  const currentOrg = organizations?.find((o) => o.id === activeOrganizationId);
  const isAdmin = currentOrg?.role === 'admin';
  const settingsBase = `/${slug}/settings`;

  const filteredTabs = tabs.filter((tab) => {
    if (tab.path === 'members' || tab.path === 'invites') return isAdmin;
    return true;
  });

  // Redirect non-admins if they try to access restricted tabs directly via URL.
  // We only redirect if we have definitively loaded the organization data.
  const isRestrictedPath =
    location.pathname.endsWith('/members') || location.pathname.endsWith('/invites');

  if (organizations && !isAdmin && isRestrictedPath) {
    return <Navigate to={settingsBase + '/profile'} replace />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description={
          isAdmin
            ? 'Manage your organization settings, members, and invitations.'
            : 'View and manage your organization profile.'
        }
      />
      <div className="mt-6 space-y-6">
        <RouteTabs tabs={filteredTabs} basePath={settingsBase} />
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
