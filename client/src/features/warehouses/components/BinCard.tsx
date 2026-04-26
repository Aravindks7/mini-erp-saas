import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Box } from 'lucide-react';

export interface Bin {
  id?: string;
  code: string;
  name?: string | null;
}

export function BinCard({ bin }: { bin: Bin }) {
  return (
    <Card className="border-muted-foreground/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-muted/30 py-3 border-b">
        <div className="flex items-center gap-2">
          <Box className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">{bin.code}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground">{bin.name || 'No description provided'}</p>
      </CardContent>
    </Card>
  );
}
