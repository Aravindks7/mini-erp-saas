import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export default function ShipmentsListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Shipments"
        description="Manage outbound deliveries and track fulfillment of Sales Orders."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Truck className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Shipments module is currently under development. This will handle the Pick-Pack-Ship
            workflow for your customers.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
          <div className="text-muted-foreground text-sm italic">
            Fulfillment & Logistics Engine (Phase 1)
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
