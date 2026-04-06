import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Upload, X, FileIcon, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import * as React from 'react';

interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: DropzoneOptions['accept'];
  isLoading?: boolean;
  progress?: number;
  error?: string;
  className?: string;
}

/**
 * FileUpload Component
 * A controlled, domain-agnostic wrapper for react-dropzone.
 * Handles UI states (drag, error, upload progress) while leaving storage logic to the caller.
 */
export const FileUpload = ({
  value = [],
  onChange,
  onRemove,
  maxFiles = 1,
  maxSize = 10485760, // 10MB default
  accept,
  isLoading = false,
  progress,
  error,
  className,
}: FileUploadProps) => {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      if (onChange) {
        // Handle single vs multiple files
        if (maxFiles === 1) {
          onChange([acceptedFiles[0]]);
        } else {
          onChange([...value, ...acceptedFiles].slice(0, maxFiles));
        }
      }
    },
    [onChange, value, maxFiles],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
    disabled: isLoading,
  });

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(index);
    }
  };

  const errorMessage = error || (fileRejections.length > 0 ? 'Invalid file(s) selected' : '');

  return (
    <div className={cn('space-y-4 w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50',
          isLoading && 'opacity-50 cursor-not-allowed',
          errorMessage && 'border-destructive/50 bg-destructive/5',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isLoading ? (
            <Loader2 className="w-10 h-10 mb-3 text-primary animate-spin" />
          ) : (
            <Upload
              className={cn('w-10 h-10 mb-3 text-muted-foreground', isDragActive && 'text-primary')}
            />
          )}
          <p className="mb-2 text-sm font-semibold">
            {isDragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </div>

      {progress !== undefined && progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid gap-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 text-sm bg-muted/40 border rounded-lg group hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-background rounded border">
                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleRemove(index, e)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
