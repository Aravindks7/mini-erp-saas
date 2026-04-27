import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function InvoicesListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Sales Invoices"
        description="Generate and manage invoices for goods shipped to customers."
      />

      <Card className="mt-6 border-dashed">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <FileText className="text-primary" size={24} />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The Sales Invoices module is currently under development. It will handle customer
            billing and Accounts Receivable tracking.
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
