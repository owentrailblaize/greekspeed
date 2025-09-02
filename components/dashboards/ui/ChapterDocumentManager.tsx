'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  FolderOpen,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Lock
} from 'lucide-react';
import { documentUploadService, DocumentUploadData } from '@/lib/services/documentUploadService';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase/client'; // Fixed import path

// Mock data structure that matches your future database schema
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
  storage_path?: string; // Added for delete functionality
}

interface ChapterDocumentManagerProps {
  chapterId?: string;
  className?: string;
}

// Add this new interface for upload form data
interface DocumentUploadFormData {
  title: string;
  description: string;
  documentType: string;
  visibility: string[];
  tags: string[];
  effectiveDate: string;
  expiresAt?: string;
  reviewBy?: string;
}

export function ChapterDocumentManager({ chapterId, className }: ChapterDocumentManagerProps) {
  // State management
  const [documents, setDocuments] = useState<ChapterDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ChapterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Add new state for upload form
  const [uploadFormData, setUploadFormData] = useState<DocumentUploadFormData>({
    title: '',
    description: '',
    documentType: 'other', // Changed from 'general' to 'other'
    visibility: ['admins'], // Changed from ['Admins']
    tags: [],
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [chapterId]);

  // Filter documents when search or tab changes
  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, activeTab]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Replace mock data with actual API call
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_owner_id_fkey(full_name)
        `)
        .eq('chapter_id', chapterId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        setDocuments([]);
      } else {
        // Transform the data to match your ChapterDocument interface
        const transformedDocuments: ChapterDocument[] = documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          file_url: doc.file_url,
          file_type: doc.mime_type,
          file_size: doc.file_size,
          owner_id: doc.owner_id,
          chapter_id: doc.chapter_id,
          visibility: doc.visibility,
          document_type: doc.document_type === 'chapter_document' ? 'chapter_document' : 'general',
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          owner_name: doc.profiles?.full_name,
          tags: doc.tags || [],
          storage_path: doc.storage_path // Add storage_path to transformed documents
        }));
        
        setDocuments(transformedDocuments);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Apply search filter only
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply tab filter
    if (activeTab === 'recent') {
      filtered = filtered.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ).slice(0, 5);
    } else if (activeTab === 'important') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes('legal') || 
        doc.tags?.includes('finance') ||
        doc.visibility.includes('admins')
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleViewDocument = async (doc: ChapterDocument) => {
    // Functionality is locked - show toast message
    toast.info('Document viewing is currently locked. This feature will be available soon!');
    
    // TODO: Implement when signed URLs are working
    // try {
    //   if (doc.file_url) {
    //     window.open(doc.file_url, '_blank');
    //   } else {
    //     toast.error('Document not accessible');
    //   }
    // } catch (error) {
    //   console.error('Error viewing document:', error);
    //   toast.error('Unable to open document. Please try again.');
    // }
  };

  const handleEditDocument = (doc: ChapterDocument) => {
    // Functionality is locked - show toast message
    toast.info('Document editing is currently locked. This feature will be available soon!');
    
    // TODO: Implement edit functionality
    // console.log('Edit document:', doc);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      const docToDelete = documents.find(doc => doc.id === documentId);
      if (!docToDelete) {
        toast.error('Document not found');
        return;
      }

      console.log('🗑️ Deleting document:', {
        id: docToDelete.id,
        title: docToDelete.title,
        storage_path: docToDelete.storage_path
      });

      // Debug storage access
      console.log('🔍 Testing storage access...');
      
      // Test 1: List root directory
      const { data: rootList, error: rootError } = await supabase.storage
        .from('chapter-documents')
        .list('', { limit: 100 });
      console.log('📁 Root listing:', { data: rootList, error: rootError });
      
      // Test 2: List specific chapter directory
      const { data: chapterList, error: chapterError } = await supabase.storage
        .from('chapter-documents')
        .list('Sigma Chi Eta (Ole Miss)', { limit: 100 });
      console.log('📁 Chapter listing:', { data: chapterList, error: chapterError });
      
      // Test 3: Check if file exists
      const { data: fileExists, error: fileError } = await supabase.storage
        .from('chapter-documents')
        .list('Sigma Chi Eta (Ole Miss)/governance', { limit: 100 });
      console.log('📁 Governance listing:', { data: fileExists, error: fileError });

      // FIRST: List what's actually in the bucket to debug
      const { data: bucketContents, error: listError } = await supabase.storage
        .from('chapter-documents')
        .list('', { limit: 100 });

      if (listError) {
        console.error('❌ Error listing bucket:', listError);
      } else {
        console.log('📁 Actual bucket contents:', bucketContents);
      }

      // SECOND: Try to delete with the exact path
      if (docToDelete.storage_path) {
        const pathsToTry = [
          docToDelete.storage_path, // Original: "Sigma Chi Eta (Ole Miss)/governance/..."
          docToDelete.storage_path.replace(/^chapter-documents\//, ''), // Remove bucket prefix if present
          docToDelete.storage_path.split('/').slice(1).join('/') // Remove first segment
        ];

        console.log('🔄 Trying different path formats:', pathsToTry);

        for (const path of pathsToTry) {
          console.log(`🔄 Attempting to delete with path: "${path}"`);
          
          const { error: storageError } = await supabase.storage
            .from('chapter-documents')
            .remove([path]);

          if (!storageError) {
            console.log(`✅ Successfully deleted with path: "${path}"`);
            break;
          } else {
            console.log(`❌ Failed with path "${path}":`, storageError);
          }
        }
      }

      // Then delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('❌ Database deletion error:', dbError);
        toast.error('Failed to delete document record');
        return;
      }

      console.log('✅ Database record deleted successfully');

      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully!');

    } catch (error) {
      console.error('❌ Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (doc: ChapterDocument) => {
    try {
      if (doc.file_url) {
        // Create a temporary link element for download
        const link = document.createElement('a');
        link.href = doc.file_url;
        link.download = `${doc.title}.${doc.file_type || 'pdf'}`;
        link.target = '_blank';
        
        // Append to DOM, click, and remove
        document.body.appendChild(link);
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

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-600" />;
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText className="h-4 w-4 text-green-600" />;
    if (fileType.includes('word')) return <FileText className="h-4 w-4 text-blue-600" />;
    
    return <FileText className="h-4 w-4" />;
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

  // Add this new function to handle file selection
  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only PDF, DOCX, XLSX, and PPTX files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    
    // Auto-fill title if not set
    if (!uploadFormData.title) {
      setUploadFormData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '') // Remove file extension
      }));
    }
  };

  // Add this function to handle form submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const uploadData: DocumentUploadData = {
        title: uploadFormData.title,
        description: uploadFormData.description,
        documentType: uploadFormData.documentType,
        visibility: uploadFormData.visibility,
        tags: uploadFormData.tags,
        effectiveDate: uploadFormData.effectiveDate,
        expiresAt: uploadFormData.expiresAt || undefined,
        reviewBy: uploadFormData.reviewBy || undefined,
        file: selectedFile
      };

      const uploadedDocument = await documentUploadService.uploadDocument(uploadData);
      
      // Convert UploadedDocument to ChapterDocument format
      const newDocument: ChapterDocument = {
        id: uploadedDocument.id,
        title: uploadedDocument.title,
        description: uploadedDocument.description,
        file_url: uploadedDocument.file_url,
        file_type: uploadedDocument.mime_type,
        file_size: uploadedDocument.file_size,
        owner_id: uploadedDocument.owner_id,
        chapter_id: uploadedDocument.chapter_id,
        visibility: uploadedDocument.visibility,
        document_type: 'chapter_document', // Convert to expected type
        created_at: uploadedDocument.created_at,
        updated_at: uploadedDocument.updated_at,
        tags: uploadedDocument.tags,
        storage_path: uploadedDocument.storage_path // Add storage_path to new document
      };
      
      // Add to documents list
      setDocuments(prev => [newDocument, ...prev]);
      
      // Reset form and close modal
      setUploadFormData({
        title: '',
        description: '',
        documentType: 'other', // Changed from 'general' to 'other'
        visibility: ['admins'], // Changed from ['Admins']
        tags: [],
        effectiveDate: new Date().toISOString().split('T')[0],
        expiresAt: '',
        reviewBy: ''
      });
      setSelectedFile(null);
      setShowUploadModal(false);
      
      // Show success message
      toast.success('Document uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Add this function to handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (newTag && !uploadFormData.tags.includes(newTag) && uploadFormData.tags.length < 3) {
        setUploadFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        e.currentTarget.value = '';
      }
    }
  };

  // Add this function to remove tags
  const removeTag = (tagToRemove: string) => {
    setUploadFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <Card className={`bg-white ${className || ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileText className="h-5 w-5 text-navy-600" />
            <span>Chapter Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Layout - Preserved */}
      <div className="hidden md:block">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <FileText className="h-5 w-5 text-navy-600" />
              <span>Chapter Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Search and Filter Bar */}
            <div className="mb-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="important">Important</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Upload Button */}
            <div className="mb-4">
              <Button 
                onClick={handleUpload}
                className="w-full bg-navy-600 hover:bg-navy-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload New Document
              </Button>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No documents found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : 'Upload your first document to get started!'
                    }
                  </p>
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Document Header */}
                        <div className="flex items-center gap-3 mb-2">
                          {getFileIcon(doc.file_type)}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {doc.title}
                            </h4>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Document Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{doc.owner_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(doc.updated_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{getFileSize(doc.file_size)}</span>
                          </div>
                        </div>

                        {/* Tags and Visibility */}
                        <div className="flex items-center gap-2">
                          {doc.tags?.map(tag => (
                            <Badge 
                              key={tag} 
                              className={getCategoryColor(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1 ml-2">
                            <Shield className="h-3 w-3 text-gray-400" />
                            {getVisibilityBadges(doc.visibility)}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDocument(doc)}
                          title="Document viewing is locked - coming soon!"
                          className="opacity-60 cursor-not-allowed"
                          disabled
                        >
                          <Eye className="h-4 w-4" />
                          <Lock className="h-3 w-3 ml-1 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          title="Download Document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDocument(doc)}
                          title="Document editing is locked - coming soon!"
                          className="opacity-60 cursor-not-allowed"
                          disabled
                        >
                          <Edit className="h-4 w-4" />
                          <Lock className="h-3 w-3 ml-1 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete Document"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Document Count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Showing {filteredDocuments.length} of {documents.length} documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <FileText className="h-5 w-5 text-navy-600" />
              <span>Chapter Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Mobile Tabs - Horizontal Scroll */}
            <div className="mb-4 overflow-x-auto">
              <div className="flex space-x-2 min-w-max">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'recent', label: 'Recent' },
                  { value: 'important', label: 'Important' },
                  { value: 'compliance', label: 'Compliance' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.value
                        ? 'bg-navy-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Upload Button */}
            <div className="mb-4">
              <Button 
                onClick={handleUpload}
                className="w-full bg-navy-600 hover:bg-navy-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload New Document
              </Button>
            </div>

            {/* Mobile Documents List */}
            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No documents found</p>
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(doc.file_type)}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h4>
                        </div>
                      </div>
                      
                      {/* Download Button - Top Right */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        title="Download Document"
                        className="h-7 px-2 ml-2 flex-shrink-0"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Metadata in a single row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{doc.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(doc.updated_at)}</span>
                      </div>
                    </div>

                    {/* Tags and Visibility */}
                    <div className="flex items-center gap-2 mb-2">
                      {doc.tags?.slice(0, 2).map(tag => (
                        <Badge 
                          key={tag} 
                          className={getCategoryColor(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                      <div className="flex items-center gap-1 ml-2">
                        <Shield className="h-3 w-3 text-gray-400" />
                        {getVisibilityBadges(doc.visibility.slice(0, 1))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Mobile Document Count */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Showing {filteredDocuments.length} of {documents.length} documents
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal - Preserved */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl md:max-h-[90vh] max-h-[85vh] flex flex-col">
            {/* Persistent Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg md:text-2xl font-bold text-navy-900">New Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <form onSubmit={handleUploadSubmit} className="space-y-4 md:space-y-6">
                {/* File Upload Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Document File *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 text-center hover:border-gray-400 transition-colors">
                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <FileText className="h-6 w-6" />
                          <span className="font-medium">{selectedFile.name}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove File
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 mx-auto text-gray-400" />
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF, DOCX, XLSX, PPTX up to 5MB
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx,.xlsx,.pptx"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Document Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Document Type *</label>
                  <Select 
                    value={uploadFormData.documentType} 
                    onValueChange={(value: string) => setUploadFormData(prev => ({ ...prev, documentType: value }))}
                  >
                    <SelectItem value="">Select document type</SelectItem>
                    <SelectItem value="bylaws">Bylaws & Governance</SelectItem>
                    <SelectItem value="policy">Policy Documents</SelectItem>
                    <SelectItem value="meeting_minutes">Meeting Minutes</SelectItem>
                    <SelectItem value="budget">Budget & Finance</SelectItem>
                    <SelectItem value="event_doc">Event Documents</SelectItem>
                    <SelectItem value="compliance">Compliance & Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </Select>
                </div>

                {/* Title and Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Title *</label>
                    <Input
                      value={uploadFormData.title}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={uploadFormData.description}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the document"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Tags (1-3) - Press Enter to add
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {uploadFormData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {uploadFormData.tags.length < 3 && (
                    <Input
                      placeholder="Type tag and press Enter"
                      onKeyDown={handleTagInput}
                      className="w-full"
                    />
                  )}
                </div>

                {/* Visibility */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Visibility *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'admins', label: 'Admins Only' },
                      { value: 'active_members', label: 'Active Members' },
                      { value: 'alumni', label: 'Alumni' },
                      { value: 'chapter_all', label: 'Everyone in Chapter' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={uploadFormData.visibility.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUploadFormData(prev => ({
                                ...prev,
                                visibility: [...prev.visibility, option.value]
                              }));
                            } else {
                              setUploadFormData(prev => ({
                                ...prev,
                                visibility: prev.visibility.filter(v => v !== option.value)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Effective Date *</label>
                    <Input
                      type="date"
                      value={uploadFormData.effectiveDate}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Review By (Optional)</label>
                    <Input
                      type="date"
                      value={uploadFormData.reviewBy || ''}
                      onChange={(e) => setUploadFormData(prev => ({ ...prev, reviewBy: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{uploadError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Persistent Footer */}
            <div className="flex justify-end space-x-3 p-4 md:p-6 border-t border-gray-200 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !uploadFormData.title.trim() || uploading}
                className="bg-navy-600 hover:bg-navy-700"
                onClick={handleUploadSubmit}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
