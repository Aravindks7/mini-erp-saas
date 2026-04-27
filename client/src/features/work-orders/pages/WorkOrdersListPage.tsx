import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory } from 'lucide-react';

export default function WorkOrdersListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Work Orders"
        description="Execute and track manufacturing production runs."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Factory className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Work Orders module is currently under development. This will handle the execution of
            production, consuming inventory and producing finished goods.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
          <div className="text-muted-foreground text-sm italic">
            Manufacturing & Production Engine (Phase 3)
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
