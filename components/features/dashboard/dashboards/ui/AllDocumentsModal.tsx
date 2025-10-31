'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Download, Edit, Trash2, Lock, X, User, Calendar, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import { logger } from "@/lib/utils/logger";

// Use the same interface as ChapterDocumentManager
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

interface AllDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ChapterDocument[];
}

export function AllDocumentsModal({ isOpen, onClose, documents }: AllDocumentsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reuse the same helper functions
  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-5 w-5 sm:h-4 sm:w-4" />;
    
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 sm:h-4 sm:w-4 text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" />;
    if (fileType.includes('word')) return <FileText className="h-5 w-5 sm:h-4 sm:w-4 text-blue-600" />;
    
    return <FileText className="h-5 w-5 sm:h-4 sm:w-4" />;
  };

  const getFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString();
  };

  const getVisibilityBadges = (visibility: string[]) => {
    return visibility.map(v => (
      <Badge 
        key={v} 
        variant="secondary" 
        className="text-xs"
      >
        {v}
      </Badge>
    ));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      legal: 'bg-purple-100 text-purple-800',
      finance: 'bg-green-100 text-green-800',
      safety: 'bg-red-100 text-red-800',
      policy: 'bg-blue-100 text-blue-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  // Action handlers
  const handleViewDocument = (doc: ChapterDocument) => {
    toast.info('Document viewing is currently locked. This feature will be available soon!');
  };

  const handleEditDocument = (doc: ChapterDocument) => {
    toast.info('Document editing is currently locked. This feature will be available soon!');
  };

  const handleDeleteDocument = (doc: ChapterDocument) => {
    toast.info('Document deletion is currently locked. This feature will be available soon!');
  };

  const handleDownload = async (doc: ChapterDocument) => {
    try {
      if (doc.file_url) {
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = `${doc.title}.${doc.file_type || 'pdf'}`;
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started!');
      } else {
        toast.error('Document not accessible for download');
      }
    } catch (error) {
      logger.error('Download error:', { context: [error] });
      toast.error('Download failed. Please try again.');
    }
  };

  if (!isOpen || !mounted) return null;

  // Create portal to render modal at document body level
  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-6xl max-h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xl sm:text-2xl font-bold text-navy-900">All Chapter Documents</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - All Documents List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-3">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-16 w-16 sm:h-12 sm:w-12 mx-auto mb-4 sm:mb-3 text-gray-300" />
                  <p className="text-xl sm:text-lg font-medium mb-2">No documents found</p>
                  <p className="text-base sm:text-sm">Upload your first document to get started!</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        {/* Document Header */}
                        <div className="flex items-start gap-3 mb-3 sm:mb-2">
                          {getFileIcon(doc.file_type)}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 text-base sm:text-sm break-words">
                              {doc.title}
                            </h4>
                            {doc.description && (
                              <p className="text-sm sm:text-xs text-gray-600 mt-2 sm:mt-1 break-words">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Document Metadata */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm sm:text-xs text-gray-500 mb-4 sm:mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 sm:h-3 sm:w-3" />
                            <span className="break-words">{doc.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 sm:h-3 sm:w-3" />
                            <span>{formatDate(doc.updated_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 sm:h-3 sm:w-3" />
                            <span>{getFileSize(doc.file_size)}</span>
                          </div>
                        </div>

                        {/* Tags and Visibility */}
                        <div className="flex flex-wrap items-center gap-2">
                          {doc.tags?.map(tag => (
                            <Badge 
                              key={tag} 
                              className={`${getCategoryColor(tag)} text-xs`}
                            >
                              {tag}
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1 ml-2">
                            <Shield className="h-4 w-4 sm:h-3 sm:w-3 text-gray-400" />
                            {getVisibilityBadges(doc.visibility)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-2 sm:ml-4">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                            title="Document viewing is locked - coming soon!"
                            className="opacity-60 cursor-not-allowed h-10 w-10 sm:h-8 sm:w-8 p-0"
                            disabled
                          >
                            <Eye className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Lock className="h-4 w-4 sm:h-3 sm:w-3 absolute -top-1 -right-1 text-gray-400" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          title="Download Document"
                          className="h-10 w-10 sm:h-8 sm:w-8 p-0"
                        >
                          <Download className="h-5 w-5 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDocument(doc)}
                            title="Document editing is locked - coming soon!"
                            className="opacity-60 cursor-not-allowed h-10 w-10 sm:h-8 sm:w-8 p-0"
                            disabled
                          >
                            <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Lock className="h-4 w-4 sm:h-3 sm:w-3 absolute -top-1 -right-1 text-gray-400" />
                        </div>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc)}
                            title="Document deletion is locked - coming soon!"
                            className="text-red-600 hover:text-red-700 h-10 w-10 sm:h-8 sm:w-8 p-0"
                            disabled
                          >
                            <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                          </Button>
                          <Lock className="h-4 w-4 sm:h-3 sm:w-3 absolute -top-1 -right-1 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Document Count Footer */}
            <div className="mt-6 sm:mt-4 pt-4 border-t border-gray-200">
              <p className="text-base sm:text-sm text-gray-600 text-center">
                Showing {documents.length} of {documents.length} documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
