import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Truck, MapPin, FileEdit, AlertCircle, Users } from 'lucide-react';
import * as React from 'react';

import { useSupplier, supplierKeys } from '../hooks/suppliers.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { AddressCard, type Address } from '@/components/shared/domain/AddressCard';
import { ContactCard, type Contact } from '@/components/shared/domain/ContactCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { suppliersApi } from '../api/suppliers.api';

const supplierStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function SupplierDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: supplier, isLoading, isError } = useSupplier(id);

  React.useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: supplierKeys.lists(),
      queryFn: suppliersApi.fetchSuppliers,
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !supplier) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Supplier Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The supplier record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/suppliers'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Supplier Directory
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={supplier.name}
        description={`Manage details, addresses, and contacts for ${supplier.name}.`}
        backButton={{ href: getPath('/suppliers'), label: 'Back to Directory' }}
        actions={[
          {
            label: 'Edit Supplier',
            onClick: () => navigate(getPath(`/suppliers/${supplier.id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={supplier.status} statusMap={supplierStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:shadow-sm">
            Addresses ({supplier.addresses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:shadow-sm">
            Contacts ({supplier.contacts?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Supplier Name
                    </label>
                    <p className="text-base font-semibold">{supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Tax Registration Number
                    </label>
                    <p className="text-base font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border">
                      {supplier.taxNumber || '—'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Relationship Status
                    </label>
                    <StatusBadge value={supplier.status} statusMap={supplierStatusMap} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AuditInfo createdAt={supplier.createdAt} updatedAt={supplier.updatedAt} />
        </TabsContent>

        <TabsContent
          value="addresses"
          className="mt-6 animate-in slide-in-from-left-2 duration-300"
        >
          {supplier.addresses?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supplier.addresses.map((address) => (
                <AddressCard key={address.id} address={address as Address} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Addresses"
              description="This supplier does not have any registered addresses."
              icon={MapPin}
              className="py-20"
            />
          )}
        </TabsContent>

        <TabsContent
          value="contacts"
          className="mt-6 animate-in slide-in-from-right-2 duration-300"
        >
          {supplier.contacts?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {supplier.contacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact as Contact} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Contacts"
              description="This supplier does not have any authorized contacts yet."
              icon={Users}
              className="py-20"
            />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
