import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Warehouse, MapPin, FileEdit, AlertCircle, Box } from 'lucide-react';
import * as React from 'react';

import { useWarehouse, warehouseKeys } from '../hooks/warehouses.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { AddressCard, type Address } from '@/components/shared/domain/AddressCard';
import { BinCard } from '../components/BinCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { warehousesApi } from '../api/warehouses.api';

export default function WarehouseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: warehouse, isLoading, isError } = useWarehouse(id);

  React.useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: warehouseKeys.lists(),
      queryFn: warehousesApi.fetchWarehouses,
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !warehouse) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Warehouse Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The warehouse record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/warehouses'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Warehouse List
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={warehouse.name}
        description={`Manage details, addresses, and bins for ${warehouse.name}.`}
        backButton={{ href: getPath('/warehouses'), label: 'Back to List' }}
        actions={[
          {
            label: 'Edit Warehouse',
            onClick: () => navigate(getPath(`/warehouses/${warehouse.id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:shadow-sm">
            Addresses ({warehouse.addresses?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="bins" className="data-[state=active]:shadow-sm">
            Bins ({warehouse.bins?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Warehouse Name
                    </label>
                    <p className="text-base font-semibold">{warehouse.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Warehouse Code
                    </label>
                    <p className="text-base font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border">
                      {warehouse.code}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AuditInfo createdAt={warehouse.createdAt} updatedAt={warehouse.updatedAt} />
        </TabsContent>

        <TabsContent
          value="addresses"
          className="mt-6 animate-in slide-in-from-left-2 duration-300"
        >
          {warehouse.addresses?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {warehouse.addresses.map((address) => (
                <AddressCard key={address.id} address={address as Address} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Addresses"
              description="This warehouse does not have any registered addresses."
              icon={MapPin}
              className="py-20"
            />
          )}
        </TabsContent>

        <TabsContent value="bins" className="mt-6 animate-in slide-in-from-right-2 duration-300">
          {warehouse.bins?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {warehouse.bins.map((bin) => (
                <BinCard key={bin.id || bin.code} bin={bin} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Bins"
              description="This warehouse does not have any bins configured yet."
              icon={Box}
              className="py-20"
            />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
