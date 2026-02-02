'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X, FileText, Download, Eye, Trash2, User, Calendar, Shield, Clock, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { createPortal } from 'react-dom';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { documentUploadService } from '@/lib/services/documentUploadService';

interface ChapterDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  file_size: number | null;
  owner_id: string | null;
  chapter_id: string | null;
  visibility: string[];
  document_type: 'chapter_document' | 'general';
  created_at: string;
  updated_at: string;
  owner_name?: string;
  tags?: string[];
  storage_path?: string;
}

interface DocumentDetailDrawerProps {
  doc: ChapterDocument;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (documentId: string) => void;
}

export function DocumentDetailDrawer({
  doc,
  isOpen,
  onClose,
  onDelete,
}: DocumentDetailDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { profile } = useProfile();

  // Check if current user is the document owner
  const isOwner = profile?.id === doc.owner_id;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if the file type is previewable in-app
  const isPreviewableType = (fileType: string | null) => {
    if (!fileType) return false;
    return fileType.includes('pdf') ||
      fileType.includes('image') ||
      fileType.includes('jpeg') ||
      fileType.includes('png') ||
      fileType.includes('gif') ||
      fileType.includes('webp');
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-6 w-6" />;

    if (fileType.includes('pdf')) return <FileText className="h-6 w-6 text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-6 w-6 text-green-600" />;
    if (fileType.includes('word')) return <FileText className="h-6 w-6 text-brand-accent" />;

    return <FileText className="h-6 w-6" />;
  };

  const getFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      legal: 'bg-purple-100 text-purple-800',
      finance: 'bg-green-100 text-green-800',
      safety: 'bg-red-100 text-red-800',
      policy: 'bg-accent-100 text-accent-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  const handleDownload = async () => {
    try {
      if (doc.file_url) {
        const link = document.createElement('a');  // Now correctly refers to browser document
        link.href = doc.file_url;
        link.download = `${doc.title}.${doc.file_type || 'pdf'}`;
        link.target = '_blank';

        document.body.appendChild(link);  // Now correctly refers to browser document
        link.click();
        document.body.removeChild(link);

        toast.success('Download started!');
      } else {
        toast.error('Document not accessible for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  const handleViewDocument = () => {
    if (!doc.file_url) {
      toast.error('Document URL not available');
      return;
    }

    // Open in new tab
    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteDocument = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await documentUploadService.deleteDocument(doc.id);
      toast.success('Document deleted successfully!');
      onDelete?.(doc.id);
      onClose();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const drawerContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {getFileIcon(doc.file_type)}
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words flex-1">
            {doc.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="space-y-6">
          {/* Description */}
          {doc.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 break-words">{doc.description}</p>
            </div>
          )}

          {/* Document Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Document Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Owner:</span>
                <span className="text-gray-900 font-medium">{doc.owner_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(doc.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900">{formatDate(doc.updated_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <HardDrive className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">File Size:</span>
                <span className="text-gray-900">{getFileSize(doc.file_size)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Type:</span>
                <span className="text-gray-900">{doc.file_type || 'Unknown'}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map(tag => (
                  <Badge
                    key={tag}
                    className={getCategoryColor(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Visibility */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              Visibility
            </h3>
            <div className="flex flex-wrap gap-2">
              {doc.visibility.map(v => (
                <Badge
                  key={v}
                  variant="secondary"
                  className="text-xs"
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <div className="space-y-2">
          {/* Download and View - Always on same row */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 bg-brand-primary hover:bg-brand-primary-hover rounded-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleViewDocument}
              variant="outline"
              className="flex-1 rounded-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
          {/* Delete button on its own row - only if user is owner */}
          {isOwner && (
            <Button
              onClick={handleDeleteDocument}
              variant="outline"
              className="w-full rounded-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        direction="bottom"
        modal={true}
        dismissible={true}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40 transition-opacity" />
          <Drawer.Content
            className={`
              bg-white flex flex-col z-[10000]
              fixed bottom-0 left-0 right-0
              ${isMobile
                ? 'h-[85vh] max-h-[70vh] rounded-t-[20px]'
                : 'max-w-lg mx-auto h-[80vh] max-h-[80vh] rounded-t-[20px]'
              }
              shadow-2xl border border-gray-200
              outline-none
            `}
          >
            {drawerContent}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
