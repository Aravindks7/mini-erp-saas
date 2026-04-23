import * as React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';
import { Can } from '@/components/shared/Can';
import type { Permission } from '@shared/index';

interface AddButtonProps extends Omit<ButtonProps, 'onClick'> {
  to: string;
  permission: Permission;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Universal Add Button for ERP tables.
 * Handles permissions, multi-tenant routing, and standardized styling.
 */
export function AddButton({
  to,
  permission,
  label,
  icon,
  size = 'default',
  className,
  variant = 'default',
  ...props
}: AddButtonProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  return (
    <Can I={permission}>
      <Button
        variant={variant}
        size={size}
        onClick={() => navigate(getPath(to))}
        className={className}
        {...props}
      >
        {icon || <Plus className="h-4 w-4" />}
        {label}
      </Button>
    </Can>
  );
}
