import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReceiptText } from 'lucide-react';

export default function BillsListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Vendor Bills"
        description="Track and manage invoices received from your suppliers."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ReceiptText className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Vendor Bills module is currently under development. This will handle Accounts
            Payable and the Three-Way Match process.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-b-lg">
          <div className="text-muted-foreground text-sm italic">
            Financial Accounting Engine (Phase 2)
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
