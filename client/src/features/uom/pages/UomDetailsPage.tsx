import { useParams, useNavigate } from 'react-router-dom';
import { Ruler, FileEdit, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import * as React from 'react';

import { useUom } from '../hooks/uoms.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { DetailView } from '@/components/shared/DetailView';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { UomFormSheet } from '../components/UomFormSheet';

export default function UomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: uom, isLoading, isError } = useUom(id);

  const [isEditSheetOpen, setIsEditSheetOpen] = React.useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !uom) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Unit of Measure Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The unit of measure record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/uom'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Units of Measure
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={uom.name}
        description={`Detailed view of unit of measure: ${uom.name} (${uom.code}).`}
        backButton={{ href: getPath('/uom'), label: 'Back to Units of Measure' }}
        actions={[
          {
            label: 'Edit UoM',
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
                <Ruler className="h-4 w-4 text-primary" />
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
                        label: 'UoM Name',
                        value: uom.name,
                      },
                      {
                        label: 'UoM Code',
                        value: uom.code,
                        valueClassName:
                          'font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border text-primary font-bold',
                      },
                      {
                        label: 'Is Default',
                        value: uom.isDefault ? (
                          <div className="flex items-center gap-1.5 text-success font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>System Default</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Circle className="h-4 w-4" />
                            <span>Standard Unit</span>
                          </div>
                        ),
                      },
                      {
                        label: 'Description',
                        value: uom.description,
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
          <AuditInfo createdAt={uom.createdAt} updatedAt={uom.updatedAt} />
        </TabsContent>
      </Tabs>

      <UomFormSheet isOpen={isEditSheetOpen} onClose={() => setIsEditSheetOpen(false)} uom={uom} />
    </PageContainer>
  );
}
