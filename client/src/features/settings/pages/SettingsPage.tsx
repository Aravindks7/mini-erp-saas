import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { RouteTabs } from '@/components/shared/RouteTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Building2, Users, Mail, ShieldCheck, KeyRound, Hash } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useMyPermissionsQuery } from '@/features/permission-sets';
import { PERMISSIONS } from '@shared/index';
import { APP_PATHS } from '@/lib/paths';
import { useTenantPath } from '@/hooks/useTenantPath';

const tabs = [
  { label: 'Profile', path: 'profile', icon: <Building2 className="h-4 w-4" /> },
  { label: 'Numbering', path: 'sequences', icon: <Hash className="h-4 w-4" /> },
  {
    label: 'Members',
    path: 'members',
    icon: <Users className="h-4 w-4" />,
    permission: PERMISSIONS.ORGANIZATION.MEMBERS,
  },
  {
    label: 'Invitations',
    path: 'invites',
    icon: <Mail className="h-4 w-4" />,
    permission: PERMISSIONS.ORGANIZATION.MEMBERS,
  },
  {
    label: 'Roles',
    path: 'roles',
    icon: <ShieldCheck className="h-4 w-4" />,
    permission: PERMISSIONS.ORGANIZATION.ROLES,
  },
  {
    label: 'Permission Sets',
    path: 'permission-sets',
    icon: <KeyRound className="h-4 w-4" />,
    permission: PERMISSIONS.ORGANIZATION.ROLES,
  },
];

export default function SettingsPage() {
  const { getPath } = useTenantPath();
  const location = useLocation();
  const settingsBase = getPath(APP_PATHS.settings.index());

  const { isLoading: isLoadingPermissions } = useMyPermissionsQuery();
  const canManageMembers = usePermission(PERMISSIONS.ORGANIZATION.MEMBERS);
  const canManageRoles = usePermission(PERMISSIONS.ORGANIZATION.ROLES);

  const filteredTabs = tabs.filter((tab) => {
    if (tab.permission === PERMISSIONS.ORGANIZATION.MEMBERS) return canManageMembers;
    if (tab.permission === PERMISSIONS.ORGANIZATION.ROLES) return canManageRoles;
    return true;
  });

  // Redirect if they try to access restricted tabs directly via URL.
  const isMembersPath =
    location.pathname.endsWith('/members') || location.pathname.endsWith('/invites');
  const isRolesPath =
    location.pathname.endsWith('/roles') || location.pathname.endsWith('/permission-sets');

  if (!isLoadingPermissions) {
    if (!canManageMembers && isMembersPath) {
      return <Navigate to={getPath(APP_PATHS.settings.profile())} replace />;
    }

    if (!canManageRoles && isRolesPath) {
      return <Navigate to={getPath(APP_PATHS.settings.profile())} replace />;
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="View and manage your organization profile and access controls."
      />
      <div className="mt-6 space-y-6">
        {isLoadingPermissions ? (
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-full justify-between">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-64" />
          </div>
        ) : (
          <RouteTabs tabs={filteredTabs} basePath={settingsBase} />
        )}
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </PageContainer>
  );
}
