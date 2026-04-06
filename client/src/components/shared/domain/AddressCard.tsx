import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

export interface Address {
  id?: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  isPrimary?: boolean;
  addressType?: string | null;
}

interface AddressCardProps {
  address: Address;
  className?: string;
}

/**
 * Standard Read-Only Address Card.
 * Domain-agnostic component for displaying address details consistently.
 */
export function AddressCard({ address, className }: AddressCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        address.isPrimary && 'border-primary/50 bg-primary/5',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/60" />
            {address.addressType || 'General Address'}
          </CardTitle>
          {address.isPrimary && (
            <StatusBadge
              value="primary"
              statusMap={{ primary: { label: 'Primary', tone: 'info' } }}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-1.5 antialiased">
        <div className="font-medium text-foreground">{address.addressLine1}</div>
        {address.addressLine2 && (
          <div className="text-muted-foreground">{address.addressLine2}</div>
        )}
        <div className="text-muted-foreground">
          {address.city}
          {address.state ? `, ${address.state}` : ''} {address.postalCode || ''}
        </div>
        <div className="font-semibold text-foreground/80 uppercase tracking-tight text-[11px] mt-1">
          {address.country}
        </div>
      </CardContent>
    </Card>
  );
}
