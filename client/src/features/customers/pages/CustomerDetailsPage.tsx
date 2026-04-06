import { useParams, useNavigate } from 'react-router-dom';
import { Building, MapPin, FileEdit, AlertCircle, Users, LayoutDashboard } from 'lucide-react';

import { useCustomer } from '../hooks/customers.hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { AddressCard, type Address } from '@/components/shared/domain/AddressCard';
import { ContactCard, type Contact } from '@/components/shared/domain/ContactCard';

const customerStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading, isError } = useCustomer(id);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      </PageContainer>
    );
  }

  if (isError || !customer) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Customer not found</h2>
          <Button variant="outline" onClick={() => navigate('/customers')}>
            Back to Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={customer.companyName}
        description={`Manage details, addresses, and contacts for ${customer.companyName}.`}
        breadcrumbs={
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-3 w-3" />
            <span>ERP</span>
            <span>/</span>
            <Users className="h-3 w-3" />
            <span>Customers</span>
          </div>
        }
        backButton={{ href: '/customers', label: 'Back to Directory' }}
        actions={[
          {
            label: 'Edit Customer',
            onClick: () => navigate(`/customers/${customer.id}/edit`),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={customer.status} statusMap={customerStatusMap} />
        </div>
      </PageHeader>

      <div className="flex flex-col gap-1 -mt-4 mb-6">
        <p className="text-xs font-mono text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded">
          UUID: {customer.id}
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:shadow-sm">
            Addresses ({customer.addresses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:shadow-sm">
            Contacts ({customer.contacts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                      Company Name
                    </label>
                    <p className="text-base font-medium">{customer.companyName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                      Tax Registration Number
                    </label>
                    <p className="text-base font-mono bg-muted/50 w-fit px-2 py-0.5 rounded">
                      {customer.taxNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                      Relationship Status
                    </label>
                    <StatusBadge value={customer.status} statusMap={customerStatusMap} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AuditInfo createdAt={customer.createdAt} updatedAt={customer.updatedAt} />
        </TabsContent>

        <TabsContent
          value="addresses"
          className="mt-6 animate-in slide-in-from-left-2 duration-300"
        >
          {customer.addresses?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customer.addresses.map((address) => (
                <AddressCard key={address.id} address={address as Address} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MapPin className="h-10 w-10 mb-4 opacity-20" />
                <p>No addresses registered for this customer.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent
          value="contacts"
          className="mt-6 animate-in slide-in-from-right-2 duration-300"
        >
          {customer.contacts?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customer.contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact as Contact} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 mb-4 opacity-20" />
                <p>No contacts registered for this customer.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
