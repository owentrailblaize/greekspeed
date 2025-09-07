'use client';

import { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle, Clock, Upload, Download, User, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';

// Use the same interface as DocsCompliancePanel
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

export function MobileDocsCompliancePage() {
  const [documents, setDocuments] = useState<ChapterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'current' | 'expired' | 'pending' | 'missing'>('all');
  
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Get current user's chapter_id and role from their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        setDocuments([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('chapter_id, role')
        .eq('id', user.id)
        .single();

      if (!profile?.chapter_id) {
        console.error('No chapter_id found for user');
        setDocuments([]);
        return;
      }

      // Build visibility filter based on user role
      let visibilityFilter = [];
      
      if (profile.role === 'admin') {
        // Admins can see all documents in their chapter
        visibilityFilter = ['chapter_all', 'active_members', 'alumni', 'admins'];
      } else if (profile.role === 'active_member') {
        // Active members can see documents visible to chapter_all or active_members
        visibilityFilter = ['chapter_all', 'active_members'];
      } else if (profile.role === 'alumni') {
        // Alumni can see documents visible to chapter_all or alumni
        visibilityFilter = ['chapter_all', 'alumni'];
      } else {
        // Default fallback - only chapter_all documents
        visibilityFilter = ['chapter_all'];
      }

      console.log('🔐 User role-based access:', {
        userId: user.id,
        userRole: profile.role,
        chapterId: profile.chapter_id,
        visibilityFilter: visibilityFilter
      });

      // Fetch documents with role-based visibility filtering
      const { data: documents, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles!documents_owner_id_fkey(full_name)
        `)
        .eq('chapter_id', profile.chapter_id)
        .eq('is_active', true)
        .overlaps('visibility', visibilityFilter) // This checks if any value in visibility array matches our filter
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        setDocuments([]);
      } else {
        console.log('📄 Documents loaded with role-based access:', {
          totalDocuments: documents?.length || 0,
          userRole: profile.role,
          visibilityFilter: visibilityFilter
        });

        // Transform the data to match ChapterDocument interface
        const transformedDocuments: ChapterDocument[] = (documents || []).map(doc => ({
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
          storage_path: doc.storage_path
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

  // Helper functions from DocsCompliancePanel
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

  // Determine document status based on real data
  const getDocumentStatus = (doc: ChapterDocument) => {
    // For now, we'll consider all documents as 'current' since we don't have expiration logic
    // This could be enhanced with actual expiration date logic
    return 'current';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'text-green-600 bg-green-50';
      case 'expired': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'missing': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current': return CheckCircle;
      case 'expired': return AlertCircle;
      case 'pending': return Clock;
      case 'missing': return AlertCircle;
      default: return FileText;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (activeFilter === 'all') return true;
    const status = getDocumentStatus(doc);
    return status === activeFilter;
  });

  const filterButtons = [
    { id: 'all' as const, label: 'All', count: documents.length },
    { id: 'current' as const, label: 'Current', count: documents.filter(d => getDocumentStatus(d) === 'current').length },
    { id: 'expired' as const, label: 'Expired', count: documents.filter(d => getDocumentStatus(d) === 'expired').length },
    { id: 'pending' as const, label: 'Pending', count: documents.filter(d => getDocumentStatus(d) === 'pending').length },
    { id: 'missing' as const, label: 'Missing', count: documents.filter(d => getDocumentStatus(d) === 'missing').length }
  ];

  const handleUpload = (doc: ChapterDocument) => {
    toast.info('Document upload is currently locked. This feature will be available soon!');
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
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-20 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <FileText className="h-6 w-6 text-navy-600" />
          <h1 className="text-xl font-semibold text-gray-900">Documents & Compliance</h1>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {filterButtons.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {activeFilter === 'all' ? 'No documents found' : `No ${activeFilter} documents`}
            </p>
            <p className="text-gray-400 text-sm">
              {activeFilter === 'all' ? 'Upload your first document to get started!' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredDocuments.map((doc, index) => {
              const StatusIcon = getStatusIcon(getDocumentStatus(doc));
              const status = getDocumentStatus(doc);
              return (
                <div 
                  key={doc.id} 
                  className={`px-4 py-4 ${index !== filteredDocuments.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{doc.title}</h3>
                      {doc.description && (
                        <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        {doc.tags && doc.tags.length > 0 && (
                          <Badge className={getCategoryColor(doc.tags[0])}>
                            {doc.tags[0]}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{doc.owner_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.updated_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => handleUpload(doc)}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
