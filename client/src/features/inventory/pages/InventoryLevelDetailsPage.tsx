import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useInventoryLevel, useInventoryLevelLedger } from '../hooks/inventory.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { columns as ledgerColumns } from '../components/ledger/columns';
import { APP_PATHS } from '@/lib/paths';
import { Button } from '@/components/ui/button';

export default function InventoryLevelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: level, isLoading, isError } = useInventoryLevel(id);
  const { data: ledger, isLoading: ledgerLoading } = useInventoryLevelLedger(id);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !level) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Inventory Level Not Found</h2>
          <Button
            variant="outline"
            onClick={() => navigate(getPath(APP_PATHS.inventory.index()))}
            className="mt-4"
          >
            Return to Inventory
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${level.product.name} at ${level.warehouse.name}`}
        description={`SKU: ${level.product.sku} | Bin: ${level.bin?.name || 'N/A'}`}
        backButton={{ href: APP_PATHS.inventory.index(), label: 'Back to Inventory' }}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ledger">Movement Ledger</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quantities</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailView
                  sections={[
                    {
                      items: [
                        { label: 'On Hand', value: Number(level.quantityOnHand).toLocaleString() },
                        {
                          label: 'Allocated',
                          value: Number(level.quantityAllocated).toLocaleString(),
                        },
                        {
                          label: 'Reserved',
                          value: Number(level.quantityReserved).toLocaleString(),
                        },
                      ],
                    },
                  ]}
                />
                <AuditInfo
                  createdAt={level.createdAt}
                  updatedAt={level.updatedAt}
                  className="mt-6"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ledger">
          <EntityTable
            title="Level Movement Ledger"
            description="Audit trail for this specific location."
            data={ledger || []}
            columns={ledgerColumns}
            isLoading={ledgerLoading}
            enableGlobalSearch={false}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
