import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

export default function BOMListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Bill of Materials"
        description="Define and manage recipes for manufactured products."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Layers className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The BOM module is currently under development. This will allow you to define multi-level
            assembly structures and raw material requirements.
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
