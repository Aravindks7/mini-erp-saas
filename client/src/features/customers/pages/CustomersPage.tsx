import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CustomerList } from '../components/CustomerList';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';

import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function CustomersPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Breadcrumbs />
      <PageHeader title="Customers" description="Manage your client base and their details.">
        <Button onClick={() => navigate('/customers/new')}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </PageHeader>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Directory</CardTitle>
          </div>
          <CardDescription>
            All registered organizations and their primary contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <CustomerList />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
