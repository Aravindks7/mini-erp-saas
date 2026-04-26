import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Package, Tag, FileEdit, AlertCircle, Scale, Receipt, Info } from 'lucide-react';
import * as React from 'react';

import { useProduct, productKeys } from '../hooks/products.hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge, type StatusMap } from '@/components/shared/StatusBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageContainer } from '@/components/shared/PageContainer';
import { AuditInfo } from '@/components/shared/AuditInfo';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useTenantPath } from '@/hooks/useTenantPath';
import { productsApi } from '../api/products.api';

const productStatusMap: StatusMap<string> = {
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: product, isLoading, isError } = useProduct(id);

  React.useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: productKeys.lists(),
      queryFn: productsApi.fetchProducts,
    });
  }, [queryClient]);

  if (isLoading) {
    return (
      <PageContainer>
        <SkeletonLoader variant="form" rows={3} />
      </PageContainer>
    );
  }

  if (isError || !product) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Product Not Found</h2>
          <p className="text-muted-foreground max-w-xs mb-6">
            The product record you are looking for doesn't exist or you don't have access.
          </p>
          <button
            onClick={() => navigate(getPath('/products'))}
            className="text-primary font-semibold hover:underline"
          >
            Return to Product Catalog
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={product.name}
        description={`Detailed view of product specifications, pricing, and inventory settings for ${product.name}.`}
        backButton={{ href: getPath('/products'), label: 'Back to Catalog' }}
        actions={[
          {
            label: 'Edit Product',
            onClick: () => navigate(getPath(`/products/${product.id}/edit`)),
            icon: <FileEdit className="h-4 w-4" />,
            variant: 'default',
          },
        ]}
      >
        <div className="hidden sm:block ml-4 border-l pl-4">
          <StatusBadge value={product.status} statusMap={productStatusMap} />
        </div>
      </PageHeader>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:shadow-sm">
            Pricing & Units
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in-50 duration-500">
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">General Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Product Name
                    </label>
                    <p className="text-base font-semibold">{product.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      SKU / Internal Reference
                    </label>
                    <p className="text-base font-mono bg-muted/50 w-fit px-2 py-0.5 rounded border">
                      {product.sku}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Status
                    </label>
                    <StatusBadge value={product.status} statusMap={productStatusMap} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block">
                      Description
                    </label>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {product.description || 'No description provided for this product.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AuditInfo createdAt={product.createdAt} updatedAt={product.updatedAt} />
        </TabsContent>

        <TabsContent
          value="inventory"
          className="mt-6 space-y-6 animate-in slide-in-from-right-2 duration-300"
        >
          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">Pricing & Units</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      Base Price
                    </label>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-primary">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(Number(product.basePrice))}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Scale className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      Base Unit
                    </label>
                  </div>
                  <p className="text-base font-semibold">{product.baseUom.name}</p>
                  <p className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit uppercase">
                    Code: {product.baseUom.code}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-3 w-3 text-muted-foreground" />
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      Tax Configuration
                    </label>
                  </div>
                  {product.tax ? (
                    <>
                      <p className="text-base font-semibold">{product.tax.name}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        Rate: {product.tax.rate}%
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No tax applied</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted-foreground/20 overflow-hidden shadow-sm border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="bg-muted/50 p-3 rounded-full mb-3">
                <Info className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Inventory & Stock</h3>
              <p className="text-sm text-muted-foreground/70 max-w-sm mt-1">
                Stock levels and warehouse movements will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
