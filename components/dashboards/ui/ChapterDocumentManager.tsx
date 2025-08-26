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
  X
} from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVisibility, setSelectedVisibility] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ChapterDocument | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Add new state for upload form
  const [uploadFormData, setUploadFormData] = useState<DocumentUploadFormData>({
    title: '',
    description: '',
    documentType: 'general',
    visibility: ['Admins'],
    tags: [],
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mock data for development - replace with API calls later
  const mockDocuments: ChapterDocument[] = [
    {
      id: '1',
      title: 'Chapter Bylaws 2024',
      description: 'Official chapter bylaws and constitution',
      file_url: '/mock/bylaws.pdf',
      file_type: 'application/pdf',
      file_size: 245760,
      owner_id: 'user1',
      chapter_id: chapterId || 'chapter1',
      visibility: ['Admins', 'Active Members'],
      document_type: 'chapter_document',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      owner_name: 'Sarah Johnson',
      tags: ['legal', 'constitution']
    },
    {
      id: '2',
      title: 'Spring 2024 Budget',
      description: 'Chapter budget and financial planning',
      file_url: '/mock/budget.xlsx',
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.document',
      file_size: 512000,
      owner_id: 'user2',
      chapter_id: chapterId || 'chapter1',
      visibility: ['Admins', 'Treasurer'],
      document_type: 'chapter_document',
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-10T14:30:00Z',
      owner_name: 'Michael Chen',
      tags: ['finance', 'budget']
    },
    {
      id: '3',
      title: 'Risk Management Policy',
      description: 'Chapter risk management and safety guidelines',
      file_url: '/mock/risk-policy.pdf',
      file_type: 'application/pdf',
      file_size: 189440,
      owner_id: 'user3',
      chapter_id: chapterId || 'chapter1',
      visibility: ['Admins', 'Active Members'],
      document_type: 'chapter_document',
      created_at: '2024-01-05T09:15:00Z',
      updated_at: '2024-01-05T09:15:00Z',
      owner_name: 'Alex Thompson',
      tags: ['safety', 'policy']
    }
  ];

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [chapterId]);

  // Filter documents when search or filters change
  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedCategory, selectedVisibility, activeTab]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/documents?chapterId=${chapterId}&type=chapter_document`);
      // const data = await response.json();
      // setDocuments(data.documents || []);
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => 
        doc.tags?.includes(selectedCategory) || 
        doc.document_type === selectedCategory
      );
    }

    // Apply visibility filter
    if (selectedVisibility !== 'all') {
      filtered = filtered.filter(doc => 
        doc.visibility.includes(selectedVisibility)
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
        doc.visibility.includes('Admins')
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleViewDocument = (doc: ChapterDocument) => {
    setSelectedDocument(doc);
    setShowViewModal(true);
  };

  const handleEditDocument = (doc: ChapterDocument) => {
    // TODO: Implement edit functionality
    console.log('Edit document:', doc);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      
      // For now, just remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      console.log('Document deleted:', documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleDownload = (doc: ChapterDocument) => {
    // TODO: Implement actual download with proper authentication
    if (doc.file_url) {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = doc.title;
      link.click();
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
    if (!selectedFile || !uploadFormData.title.trim()) return;

    setUploading(true);
    setUploadError(null);

    try {
      // TODO: Replace with actual API call
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new document object
      const newDocument: ChapterDocument = {
        id: Date.now().toString(),
        title: uploadFormData.title.trim(),
        description: uploadFormData.description.trim(),
        file_url: URL.createObjectURL(selectedFile), // Temporary URL for demo
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        owner_id: 'current-user-id', // TODO: Get from auth context
        chapter_id: chapterId || 'chapter1',
        visibility: uploadFormData.visibility,
        document_type: 'chapter_document',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner_name: 'Current User', // TODO: Get from auth context
        tags: uploadFormData.tags
      };

      // Add to documents list
      setDocuments(prev => [newDocument, ...prev]);
      
      // Reset form and close modal
      setUploadFormData({
        title: '',
        description: '',
        documentType: 'general',
        visibility: ['Admins'],
        tags: [],
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setSelectedFile(null);
      setShowUploadModal(false);
      
    } catch (error) {
      setUploadError('Upload failed. Please try again.');
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="Admins">Admins Only</SelectItem>
                  <SelectItem value="Active Members">Active Members</SelectItem>
                  <SelectItem value="Everyone in chapter">Everyone</SelectItem>
                </SelectContent>
              </Select>
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
                  {searchQuery || selectedCategory !== 'all' || selectedVisibility !== 'all'
                    ? 'Try adjusting your search or filters'
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
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
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
                        title="Edit Document"
                      >
                        <Edit className="h-4 w-4" />
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

      {/* Upload Modal - Fixed Structure Matching EditProfileModal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Persistent Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-2xl font-bold text-navy-900">Upload New Chapter Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleUploadSubmit} className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Document File *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
                    onValueChange={(value) => setUploadFormData(prev => ({ ...prev, documentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bylaws">Bylaws & Governance</SelectItem>
                      <SelectItem value="policy">Policy Documents</SelectItem>
                      <SelectItem value="meeting_minutes">Meeting Minutes</SelectItem>
                      <SelectItem value="budget">Budget & Finance</SelectItem>
                      <SelectItem value="event_doc">Event Documents</SelectItem>
                      <SelectItem value="compliance">Compliance & Training</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
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
                      { value: 'Admins', label: 'Admins Only' },
                      { value: 'Active Members', label: 'Active Members' },
                      { value: 'Alumni', label: 'Alumni' },
                      { value: 'Everyone in chapter', label: 'Everyone in Chapter' }
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
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
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

      {/* View Document Modal Placeholder */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedDocument.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowViewModal(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Document Viewer</p>
                <p className="text-sm">This will be implemented with proper document viewing</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
