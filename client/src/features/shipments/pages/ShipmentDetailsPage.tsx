import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Package, AlertCircle, FileText } from 'lucide-react';
import * as React from 'react';

import { useShipment } from '../hooks/shipments.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { formatDate } from '@shared/utils/date';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailView } from '@/components/shared/DetailView';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const shipmentStatusMap: StatusMap<string> = {
  draft: { label: 'Draft', tone: 'neutral' },
  shipped: { label: 'Shipped', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export default function ShipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: shipment, isLoading, isError } = useShipment(id || '');

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="details" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !shipment) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Shipment Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The shipment record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/shipments'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Shipment List
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={shipment.shipmentNumber}
        description={`Outbound shipment recorded on ${formatDate(shipment.shipmentDate)}.`}
        backButton={{ onClick: () => navigate(getPath('/shipments')), label: 'Back to Shipments' }}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={shipment.status} statusMap={shipmentStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:shadow-sm">
            Shipped Items
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
              <DetailView
                columns={2}
                sections={[
                  {
                    items: [
                      {
                        label: 'Shipment Number',
                        value: shipment.shipmentNumber,
                        valueClassName: 'font-mono bg-muted/50 px-2 py-0.5 rounded border w-fit',
                      },
                      {
                        label: 'Shipment Date',
                        value: formatDate(shipment.shipmentDate),
                      },
                      {
                        label: 'Reference / Tracking #',
                        value: shipment.reference,
                      },
                      {
                        label: 'Sales Order',
                        value: shipment.salesOrder?.documentNumber,
                        icon: FileText,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>

          <AuditInfo createdAt={shipment.createdAt} updatedAt={shipment.updatedAt} />
        </TabsContent>

        <TabsContent value="items" className="mt-6 animate-in slide-in-from-left-2 duration-300">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Fulfillment Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead className="text-right pr-6">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipment.lines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className="font-medium">{line.product?.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {line.product?.sku}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{line.warehouse?.name}</TableCell>
                      <TableCell>{line.bin?.name || '-'}</TableCell>
                      <TableCell className="text-right pr-6 font-semibold text-primary">
                        {line.quantityShipped}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
