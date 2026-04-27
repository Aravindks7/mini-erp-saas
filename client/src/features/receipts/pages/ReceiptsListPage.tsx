import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageSearch } from 'lucide-react';

export default function ReceiptsListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Goods Receipts"
        description="Manage and track incoming shipments from suppliers."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <PackageSearch className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Goods Receipts module is currently under development. Once implemented, you'll be
            able to track incoming inventory against Purchase Orders.
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
