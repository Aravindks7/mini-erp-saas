import { useParams, useNavigate } from 'react-router-dom';
import { Percent, FileEdit, AlertCircle } from 'lucide-react';
import * as React from 'react';

import { useTax } from '../hooks/taxes.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { TaxFormSheet } from '../components/TaxFormSheet';

export default function TaxDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: tax, isLoading, isError } = useTax(id);

  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !tax) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Tax Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The tax record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/taxes'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Taxes
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={tax.name}
        description={`Detailed view of tax configuration for ${tax.name}.`}
        backButton={{ href: getPath('/taxes'), label: 'Back to Taxes' }}
        actions={[
          {
            label: 'Edit Tax',
            onClick: () => setIsEditSheetOpen(true),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:shadow-sm">
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg text-foreground/80">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <DetailView
                columns={2}
                sections={[
                  {
                    items: [
                      {
                        label: 'Tax Name',
                        value: tax.name,
                      },
                      {
                        label: 'Tax Rate',
                        value: `${tax.rate}%`,
                        valueClassName:
                          'font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border text-primary font-bold',
                      },
                      {
                        label: 'Description',
                        value: tax.description,
                        fullWidth: true,
                      },
                    ],
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <AuditInfo createdAt={tax.createdAt} updatedAt={tax.updatedAt} />
        </TabsContent>
      </Tabs>

      <TaxFormSheet isOpen={isEditSheetOpen} onClose={() => setIsEditSheetOpen(false)} tax={tax} />
    </PageContainer>
  );
}
