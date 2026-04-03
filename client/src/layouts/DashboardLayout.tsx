import { Outlet } from 'react-router-dom';
import AppLayout from '@/components/shared/AppLayout';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { TenantGuard } from '@/components/guards/TenantGuard';

export default function DashboardLayout() {
  return (
    <AuthGuard>
      <TenantGuard>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </TenantGuard>
    </AuthGuard>
  );
}
