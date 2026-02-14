'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/supabase/auth-context';
import { ImportSource, ProfileImport } from '@/types/profile-import';

interface ProfilePdfUploaderProps {
  /** Source type: 'linkedin_pdf' or 'resume_pdf' */
  source: ImportSource;
  /** Callback when upload completes successfully */
  onUploadComplete: (importRecord: ProfileImport, signedUrl: string) => void;
  /** Callback when upload fails (optional) */
  onError?: (error: string) => void;
  /** Additional className for styling */
  className?: string;
  /** Custom help text (optional) */
  helpText?: string;
  /** Disabled state */
  disabled?: boolean;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * ProfilePdfUploader Component
 * 
 * A drag-and-drop PDF uploader for profile imports (LinkedIn or Resume).
 * Follows the existing LogoUploader pattern with PDF-specific validation.
 */
export function ProfilePdfUploader({
  source,
  onUploadComplete,
  onError,
  className,
  helpText,
  disabled = false,
}: ProfilePdfUploaderProps) {
  const { session } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF-specific validation
  const allowedTypes = ['application/pdf'];
  const maxSize = 15 * 1024 * 1024; // 15MB (matches API limit)

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Get source display name
   */
  const getSourceLabel = (): string => {
    switch (source) {
      case 'linkedin_pdf':
        return 'LinkedIn Profile';
      case 'resume_pdf':
        return 'Resume';
      default:
        return 'PDF';
    }
  };

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF files are allowed.';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 15MB.';
    }

    if (file.size === 0) {
      return 'File appears to be empty. Please select a valid PDF.';
    }

    return null;
  };

  /**
   * Upload file to API
   */
  const uploadFile = async (file: File) => {
    setUploadState('uploading');
    setUploadProgress(0);
    setError(null);
    setSelectedFile(file);

    try {
      // Validate session
      if (!session?.access_token) {
        throw new Error('Session expired. Please log in again.');
      }

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setUploadState('error');
        onError?.(validationError);
        toast.error(validationError);
        return;
      }

      // Simulate progress (fetch doesn't support progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 150);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('source', source);

      // Upload to API
      const response = await fetch('/api/profile-import/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const data = await response.json();

      if (!data.success || !data.import) {
        throw new Error('Invalid response from server');
      }

      // Success!
      setUploadProgress(100);
      setUploadState('success');
      toast.success(`${getSourceLabel()} PDF uploaded successfully!`);
      
      // Call success callback
      onUploadComplete(data.import as ProfileImport, data.signedUrl);

    } catch (err) {
      console.error('Error uploading PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload PDF';
      setError(errorMessage);
      setUploadState('error');
      setUploadProgress(0);
      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    await uploadFile(file);
  }, [session, source, onUploadComplete, onError]);

  /**
   * Handle file input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && uploadState !== 'uploading') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploadState === 'uploading') return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    if (selectedFile) {
      handleFileSelect(selectedFile);
    } else {
      // Reset to allow new file selection
      setUploadState('idle');
      setError(null);
      setSelectedFile(null);
    }
  };

  /**
   * Handle reset/cancel
   */
  const handleReset = () => {
    setUploadState('idle');
    setUploadProgress(0);
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled && uploadState !== 'uploading') {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={uploadState === 'idle' ? handleClick : undefined}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all',
          isDragging
            ? 'border-brand-primary bg-brand-primary/5 scale-[1.02]'
            : 'border-gray-300',
          uploadState === 'idle' && !disabled && 'cursor-pointer hover:border-gray-400 hover:bg-gray-50',
          uploadState === 'uploading' && 'opacity-80 cursor-wait',
          uploadState === 'success' && 'border-green-300 bg-green-50',
          uploadState === 'error' && 'border-red-300 bg-red-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Idle State */}
        {uploadState === 'idle' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={cn(
              'rounded-full p-4 transition-colors',
              isDragging ? 'bg-brand-primary/10' : 'bg-gray-100'
            )}>
              <Upload className={cn(
                'h-8 w-8 transition-colors',
                isDragging ? 'text-brand-primary' : 'text-gray-400'
              )} />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-gray-700">
                {isDragging ? 'Drop your PDF here' : 'Drag and drop your PDF here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              disabled={disabled}
              className="gap-2 rounded-full"
            >
              <FileText className="h-4 w-4" />
              Choose PDF File
            </Button>
            <p className="text-xs text-gray-400">
              PDF files only • Max 15MB
            </p>
          </div>
        )}

        {/* Uploading State */}
        {uploadState === 'uploading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-brand-primary/10 p-4">
              <Loader2 className="h-8 w-8 text-brand-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-gray-700">
                Uploading your {getSourceLabel()} PDF...
              </p>
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {uploadState === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-green-700">
                Upload complete!
              </p>
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {uploadState === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-red-700">
                Upload failed
              </p>
              <p className="text-sm text-red-600 mt-1 max-w-xs">
                {error}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-gray-600"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || uploadState === 'uploading'}
        />
      </div>

      {/* Help Text */}
      {helpText && uploadState === 'idle' && (
        <p className="text-xs text-gray-500 text-center">
          {helpText}
        </p>
      )}

      {/* File Info (when success/error with file selected) */}
      {selectedFile && (uploadState === 'success' || uploadState === 'error') && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ProfilePdfUploader;
