import { Outlet } from 'react-router-dom';
import AppLayout from '@/components/shared/AppLayout';

export default function DashboardLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
