'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download, Edit, Trash2, Lock, X, User, Calendar, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { AllDocumentsModal } from './AllDocumentsModal';

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

export function DocsCompliancePanel() {
  const [documents, setDocuments] = useState<ChapterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllDocumentsModal, setShowAllDocumentsModal] = useState(false);

  // Load documents on component mount (limit to 3)
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

      // User role-based access
      console.log('User access details:', {
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
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error loading documents:', error);
        setDocuments([]);
      } else {
        // Documents loaded with role-based access
        console.log('Documents loaded:', {
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

  // Reuse the same helper functions from ChapterDocumentManager
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

  // Reuse the same action handlers (locked functionality)
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
      console.error('Download error:', error);
      toast.error('Download failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileText className="h-5 w-5 text-navy-600" />
            <span>Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-navy-600"></div>
            <span className="ml-2 text-gray-600">Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <FileText className="h-5 w-5 text-navy-600" />
            <span>Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {documents.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No documents found</p>
              </div>
            ) : (
              documents.map((doc) => (
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
          
          <Button 
            onClick={() => setShowAllDocumentsModal(true)}
            variant="outline"
            className="w-full h-10 rounded-full text-navy-600 border-navy-600 bg-white hover:bg-navy-50 font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-300 mt-4"
          >
             All Documents
          </Button>
        </CardContent>
      </Card>

      <AllDocumentsModal 
        isOpen={showAllDocumentsModal}
        onClose={() => setShowAllDocumentsModal(false)}
        documents={documents}
      />
    </>
  );
} 