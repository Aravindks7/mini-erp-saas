'use no memo';

import * as React from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  endpoint: string;
  filename?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
}

/**
 * A reusable Export button that handles downloading CSV/Excel files from a backend endpoint.
 */
export function ExportButton({
  endpoint,
  filename = 'export.csv',
  variant = 'outline',
  size = 'default',
  label = 'Export',
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const activeOrgId = localStorage.getItem('erp_active_org_id');
      const headers = new Headers();
      if (activeOrgId) {
        headers.set('x-organization-id', activeOrgId);
      }

      // We use native fetch here because apiFetch is designed for JSON/text parsing
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={isExporting}
      className={className}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : label}
    </Button>
  );
}
