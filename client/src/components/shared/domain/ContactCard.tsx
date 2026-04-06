import { Mail, Phone, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserDisplay } from '@/components/shared/UserDisplay';
import { cn } from '@/lib/utils';

export interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  isPrimary?: boolean;
}

interface ContactCardProps {
  contact: Contact;
  className?: string;
}

/**
 * Standard Read-Only Contact Card.
 * Domain-agnostic component for displaying contact details with UserDisplay integration.
 */
export function ContactCard({ contact, className }: ContactCardProps) {
  const fullName = `${contact.firstName} ${contact.lastName}`;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:shadow-md',
        contact.isPrimary && 'border-primary/50 bg-primary/5',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <UserDisplay name={fullName} email={contact.email || undefined} size="sm" />
          {contact.isPrimary && (
            <StatusBadge
              value="primary"
              statusMap={{ primary: { label: 'Primary', tone: 'info' } }}
            />
          )}
        </div>
        {contact.jobTitle && (
          <CardDescription className="pl-[41px] flex items-center gap-1.5 text-xs font-medium">
            <Briefcase className="h-3 w-3 text-muted-foreground" />
            {contact.jobTitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="text-sm space-y-2 pt-2">
        {contact.email && (
          <div className="flex items-center gap-3 pl-[41px]">
            <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
            <a
              href={`mailto:${contact.email}`}
              className="text-primary hover:underline transition-colors decoration-primary/30"
            >
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-3 pl-[41px]">
            <Phone className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-foreground/80 tabular-nums">{contact.phone}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
