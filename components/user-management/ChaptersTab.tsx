'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Lock,
  MapPin,
  Users,
  Calendar,
  GraduationCap,
  Shield,
  AlertTriangle,
  X
} from 'lucide-react';
import { ViewChapterModal } from './ViewChapterModal';
import { DeleteChapterModal } from './DeleteChapterModal';
import { CreateChapterForm } from './CreateChapterForm';
import { logger } from "@/lib/utils/logger";

interface Chapter {
  id: string;
  name: string;
  description: string;
  location: string;
  member_count: number;
  founded_year: number;
  university: string;
  slug: string;
  national_fraternity: string;
  chapter_name: string;
  school: string;
  school_location: string;
  chapter_status: string;
  created_at: string;
  updated_at: string;
}

export function ChaptersTab() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewChapter, setViewChapter] = useState<Chapter | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Add delete state variables
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalChapters, setTotalChapters] = useState(0);
  const [pageSize] = useState(100); // Show 100 chapters per page

  useEffect(() => {
    fetchChapters();
  }, [currentPage]);

  const fetchChapters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/developer/chapters?page=${currentPage}&limit=${pageSize}`);
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
        setTotalChapters(data.total || 0);
        setTotalPages(data.totalPages || 1);
        // Fetched page chapters
      } else {
        logger.error('Failed to fetch chapters');
      }
    } catch (error) {
      logger.error('Error fetching chapters:', { context: [error] });
    } finally {
      setLoading(false);
    }
  };

  const handleViewChapter = (chapter: Chapter) => {
    setViewChapter(chapter);
    setIsViewModalOpen(true);
  };

  // Add delete handler functions
  const openDeleteModal = (chapter: Chapter) => {
    setChapterToDelete(chapter);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setChapterToDelete(null);
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;

    try {
      setDeletingChapterId(chapterToDelete.id);
      
      const response = await fetch(`/api/developer/chapters?chapterId=${chapterToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete chapter');
      }

      const result = await response.json();
      // Chapter deleted successfully
      
      // Remove the chapter from the local state
      setChapters(prevChapters => prevChapters.filter(chapter => chapter.id !== chapterToDelete.id));
      
      // Close modal and show success message
      closeDeleteModal();
      
      // Show success message
      alert(`Chapter "${chapterToDelete.name}" has been deleted successfully.`);
      
    } catch (error) {
      logger.error('Error deleting chapter:', { context: [error] });
      alert(`Failed to delete chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingChapterId(null);
    }
  };

  const filteredChapters = chapters.filter(chapter =>
    chapter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.national_fraternity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chapter.chapter_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading chapters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chapter Management</h2>
          <p className="text-gray-600">Create and manage fraternity chapters</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Chapter</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search chapters by name, university, fraternity, or chapter name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Chapters Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>All Chapters ({totalChapters.toLocaleString()})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="overflow-x-auto">
            {/* Scrollable container with fixed height */}
            <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Chapter Info</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Location & University</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">National Fraternity</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Members & Founded</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Status</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Created</th>
                    <th className="text-left p-3 font-medium text-sm bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChapters.map((chapter) => (
                    <tr key={chapter.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{chapter.name}</p>
                          <p className="text-sm text-gray-600">{chapter.chapter_name}</p>
                          <p className="text-xs text-gray-500">{chapter.slug}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{chapter.location}</p>
                            <p className="text-sm text-gray-600">{chapter.university}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{chapter.national_fraternity}</p>
                          <p className="text-sm text-gray-600">{chapter.school}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{chapter.member_count}</span>
                          <span className="text-gray-400">|</span>
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{chapter.founded_year}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={chapter.chapter_status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {chapter.chapter_status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-600">
                          {new Date(chapter.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewChapter(chapter)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Edit Button with Lock Indicator */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0 bg-gray-50 cursor-not-allowed opacity-60"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <div className="absolute -top-1 -right-1">
                              <Lock className="h-3 w-3 text-gray-500" />
                            </div>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDeleteModal(chapter)}
                            disabled={deletingChapterId === chapter.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                <p>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalChapters)} of {totalChapters.toLocaleString()} chapters</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Page</span>
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-sm text-gray-600">of</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Chapter Modal */}
      {isViewModalOpen && viewChapter && (
        <ViewChapterModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          chapter={viewChapter}
        />
      )}

      {/* Create Chapter Form */}
      {showCreateForm && (
        <CreateChapterForm 
          onClose={() => setShowCreateForm(false)} 
          onSuccess={fetchChapters} 
        />
      )}

      {/* Delete Chapter Modal */}
      <DeleteChapterModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteChapter}
        chapter={chapterToDelete}
        isDeleting={deletingChapterId === chapterToDelete?.id}
      />
    </div>
  );
}
