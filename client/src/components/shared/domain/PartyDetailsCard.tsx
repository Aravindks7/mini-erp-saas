import { Mail, Phone, User, Edit2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Address {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Contact {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface PartyDetailsCardProps {
  type: 'Customer' | 'Supplier';
  name: string;
  contact?: Contact;
  shippingAddress?: Address;
  billingAddress?: Address;
  onEdit?: () => void;
  className?: string;
}

/**
 * A consolidated card to display information about a party (Customer or Supplier).
 * Includes entity name, contact details, and addresses in a structured, premium layout.
 */
export function PartyDetailsCard({
  type,
  name,
  contact,
  shippingAddress,
  billingAddress,
  onEdit,
  className,
}: PartyDetailsCardProps) {
  return (
    <Card className={cn('border-border/60 shadow-sm overflow-hidden', className)}>
      <CardHeader className="bg-muted/30 py-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-semibold">{type} Details</CardTitle>
        </div>
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {/* Entity Header Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate hover:text-primary cursor-pointer transition-colors">
                {name}
              </p>
              <p className="text-[11px] text-muted-foreground">Active {type}</p>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Contact Information Section */}
        <div className="p-4 space-y-3">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Contact Details
          </h4>
          <div className="space-y-2">
            {contact ? (
              <>
                <div className="flex items-center gap-2.5 text-sm group cursor-pointer">
                  <User className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-foreground/90 font-medium truncate">
                    {contact.firstName} {contact.lastName}
                  </span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2.5 text-sm group cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-primary truncate underline-offset-4 group-hover:underline">
                      {contact.email}
                    </span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2.5 text-sm group">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-muted-foreground truncate">{contact.phone}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground italic">No contact information</p>
            )}
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Shipping Address Section */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Shipping Address
            </h4>
            {shippingAddress && (
              <Button
                variant="link"
                className="h-auto p-0 text-[10px] font-semibold text-primary gap-1"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Map
              </Button>
            )}
          </div>
          {shippingAddress ? (
            <div className="space-y-1 text-[13px] text-muted-foreground leading-relaxed">
              <p className="text-foreground/80">{shippingAddress.addressLine1}</p>
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No shipping address provided</p>
          )}
        </div>

        {billingAddress && (
          <>
            <Separator className="bg-border/40" />
            {/* Billing Address Section - Only shown if it's likely different or explicitly provided */}
            <div className="p-4 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                Billing Address
              </h4>
              <div className="space-y-1 text-[13px] text-muted-foreground leading-relaxed">
                <p className="text-foreground/80">{billingAddress.addressLine1}</p>
                <p>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                </p>
                <p>{billingAddress.country}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
