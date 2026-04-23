'use no memo';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ExportButton } from './ExportButton';

interface ImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ row: number; message: string }>;
  successfulRecords?: Array<unknown>;
}

interface ImportModalProps {
  endpoint: string;
  templateEndpoint?: string;
  title?: string;
  description?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ImportModal({
  endpoint,
  templateEndpoint,
  title = 'Import Data',
  description = 'Upload a CSV file to import records.',
  onSuccess,
  trigger,
}: ImportModalProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleImport = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const activeOrgId = localStorage.getItem('erp_active_org_id');
      const headers = new Headers();
      if (activeOrgId) {
        headers.set('x-organization-id', activeOrgId);
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to import data');
      }

      setResult(data);
      toast.success(`Import complete: ${data.successCount} succeeded, ${data.failedCount} failed.`);
    } catch (error: unknown) {
      console.error('Import error:', error);
      toast.error(
        (error as Error).message || 'Failed to import data. Please check the file format.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setIsUploading(false);
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      if (result && result.successCount > 0 && onSuccess) {
        onSuccess();
      }
      setTimeout(reset, 300);
    }
  };

  // Helper to format values for display
  const formatValue = (key: string, value: unknown) => {
    if (value === null || value === undefined) return '';
    if (
      key.toLowerCase().includes('date') ||
      key.toLowerCase() === 'createdat' ||
      key.toLowerCase() === 'updatedat'
    ) {
      try {
        return format(new Date(value as string | number | Date), 'dd/MM/yyyy');
      } catch {
        return String(value);
      }
    }
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!result ? (
            <div className="space-y-4 py-4">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50',
                  file ? 'border-primary/50 bg-primary/5' : '',
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <>
                      <FileText className="h-10 w-10 text-primary" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop a CSV file here'}
                      </p>
                      <p className="text-xs text-muted-foreground">or click to select a file</p>
                    </>
                  )}
                </div>
              </div>

              {templateEndpoint && (
                <div className="flex items-center justify-between text-xs p-3 bg-muted rounded-md border">
                  <span className="text-muted-foreground">Need a starting point?</span>
                  <ExportButton
                    endpoint={templateEndpoint}
                    filename="template.csv"
                    variant="ghost"
                    size="sm"
                    label="Download Template"
                    className="h-7 text-xs"
                  />
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Uploading and processing...</span>
                  </div>
                  <Progress value={undefined} className="h-1" />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Alert
                variant={result.failedCount > 0 ? 'default' : 'default'}
                className={cn(result.failedCount === 0 ? 'border-green-500/50 bg-green-500/5' : '')}
              >
                {result.failedCount === 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.failedCount === 0 ? 'Success' : 'Import Partially Complete'}
                </AlertTitle>
                <AlertDescription>
                  Processed {result.totalProcessed} records. {result.successCount} imported
                  successfully.
                </AlertDescription>
              </Alert>
              {result.errors.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 space-y-1 bg-muted/50">
                  <p className="text-xs font-semibold px-1 mb-2">Errors ({result.errors.length})</p>
                  {result.errors.map((error, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] flex gap-2 border-b last:border-0 pb-1 mb-1"
                    >
                      <span className="font-mono text-muted-foreground shrink-0">
                        Row {error.row}:
                      </span>
                      <span className="text-destructive">{error.message}</span>
                    </div>
                  ))}
                </div>
              )}
              {result.successfulRecords && result.successfulRecords.length > 0 && (
                <div className="border rounded-md p-2 space-y-1">
                  <p className="text-xs font-semibold px-1 mb-2">
                    Imported Records ({result.successfulRecords.length})
                  </p>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-muted/50">
                        <tr>
                          {['Company Name', 'Tax Number', 'Status', 'Created At', 'Updated At'].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-2 py-1 font-medium text-muted-foreground whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {result.successfulRecords.map((record: any, i) => (
                          <tr key={record.id || i} className="border-b last:border-0">
                            <td className="px-2 py-1 truncate max-w-[150px]">
                              {formatValue('companyName', record.companyName)}
                            </td>
                            <td className="px-2 py-1 truncate max-w-[150px]">
                              {formatValue('taxNumber', record.taxNumber)}
                            </td>
                            <td className="px-2 py-1 truncate max-w-[150px] capitalize">
                              {formatValue('status', record.status)}
                            </td>
                            <td className="px-2 py-1 truncate max-w-[150px]">
                              {formatValue('createdAt', record.createdAt)}
                            </td>
                            <td className="px-2 py-1 truncate max-w-[150px]">
                              {formatValue('updatedAt', record.updatedAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}{' '}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-2 border-t">
          {!result ? (
            <>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isUploading}>
                {isUploading ? 'Importing...' : 'Start Import'}
              </Button>
            </>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
