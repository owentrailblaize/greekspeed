'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Building2,
  Plus,
  Eye,
  Edit,
  Palette,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { BrandingPreview } from './BrandingPreview';
import { brandingToTheme } from '@/types/branding';
import type { ChapterBranding } from '@/types/branding';
import { useAuth } from '@/lib/supabase/auth-context';

interface Chapter {
  id: string;
  name: string;
  chapter_name?: string;
  university?: string;
  national_fraternity?: string;
}

interface BrandingRecord extends ChapterBranding {
  chapter?: Chapter;
}

interface ChapterBrandingListProps {
  /** Optional className */
  className?: string;
}

/**
 * ChapterBrandingList Component
 *
 * Displays all chapters with their branding status in a table/card view.
 * Shows branding information, status badges, and provides Edit/View actions.
 */
export function ChapterBrandingList({ className }: ChapterBrandingListProps) {
  const router = useRouter();
  const { session } = useAuth();

  const [brandingRecords, setBrandingRecords] = useState<BrandingRecord[]>([]);
  const [chaptersWithoutBranding, setChaptersWithoutBranding] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(50);
  const [viewingBranding, setViewingBranding] = useState<BrandingRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Fetch branding data
  const fetchBrandingData = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(
        `/api/branding/chapters?page=${currentPage}&limit=${pageSize}${searchParam}`,
        { headers }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Please log in.');
        }
        if (response.status === 403) {
          throw new Error('Developer access required.');
        }
        throw new Error('Failed to fetch branding data');
      }

      const data = await response.json();
      setBrandingRecords(data.branding || []);
      setChaptersWithoutBranding(data.chaptersWithoutBranding || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching branding data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load branding data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, currentPage, pageSize, searchTerm]);

  // Debounce search - reset to page 1 when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Fetch branding data when dependencies change
  useEffect(() => {
    fetchBrandingData();
  }, [fetchBrandingData]);

  // Combine all chapters for display
  const allChapters = useMemo(() => {
    const withBranding = brandingRecords.map((record) => ({
      id: record.chapter?.id || record.chapter_id,
      name: record.chapter?.name || 'Unknown Chapter',
      chapter_name: record.chapter?.chapter_name,
      university: record.chapter?.university,
      national_fraternity: record.chapter?.national_fraternity,
      branding: record,
      hasBranding: true,
    }));

    const withoutBranding = chaptersWithoutBranding.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      chapter_name: chapter.chapter_name,
      university: chapter.university,
      national_fraternity: chapter.national_fraternity,
      branding: null,
      hasBranding: false,
    }));

    // Filter by search term
    const all = [...withBranding, ...withoutBranding];
    if (!searchTerm.trim()) return all;

    const query = searchTerm.toLowerCase();
    return all.filter(
      (chapter) =>
        chapter.name.toLowerCase().includes(query) ||
        chapter.chapter_name?.toLowerCase().includes(query) ||
        chapter.university?.toLowerCase().includes(query) ||
        chapter.national_fraternity?.toLowerCase().includes(query)
    );
  }, [brandingRecords, chaptersWithoutBranding, searchTerm]);

  const handleEdit = (chapterId: string) => {
    // Navigate with query param - page will switch to sidebar view and select chapter
    router.push(`/dashboard/developer/branding?chapter=${chapterId}&view=sidebar`);
  };

  const handleView = (branding: BrandingRecord) => {
    setViewingBranding(branding);
    setIsViewModalOpen(true);
  };

  const handleCreateBranding = (chapterId: string) => {
    router.push(`/dashboard/developer/branding?chapter=${chapterId}`);
  };

  if (loading && allChapters.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <span className="ml-3 text-gray-600">Loading branding data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && allChapters.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Branding</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchBrandingData()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Palette className="h-6 w-6 text-brand-primary" />
              Chapter Branding
            </h2>
            <p className="text-gray-600">Manage branding for all chapters</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chapters by name, university, or chapter name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Chapters</p>
                  <p className="text-2xl font-bold text-gray-900">{allChapters.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Branding</p>
                  <p className="text-2xl font-bold text-green-600">
                    {allChapters.filter((c) => c.hasBranding).length}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Without Branding</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {allChapters.filter((c) => !c.hasBranding).length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapters Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>All Chapters ({allChapters.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {allChapters.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm ? 'No chapters match your search.' : 'No chapters found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">Chapter</th>
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">
                            Branding Status
                          </th>
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">Logos</th>
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">Colors</th>
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">Updated</th>
                          <th className="text-left p-3 font-medium text-sm bg-gray-50">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allChapters.map((chapter) => (
                          <tr key={chapter.id} className="border-b hover:bg-gray-50">
                            {/* Chapter Info */}
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{chapter.name}</p>
                                {chapter.chapter_name && (
                                  <p className="text-sm text-gray-600">{chapter.chapter_name}</p>
                                )}
                                {chapter.university && (
                                  <p className="text-xs text-gray-500">{chapter.university}</p>
                                )}
                              </div>
                            </td>

                            {/* Branding Status */}
                            <td className="p-3">
                              {chapter.hasBranding ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Configured
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Not Configured
                                </Badge>
                              )}
                            </td>

                            {/* Logos */}
                            <td className="p-3">
                              {chapter.hasBranding && chapter.branding ? (
                                <div className="flex items-center gap-2">
                                  {chapter.branding.primary_logo_url ? (
                                    <img
                                      src={chapter.branding.primary_logo_url}
                                      alt={chapter.branding.logo_alt_text || 'Primary logo'}
                                      className="h-8 w-8 object-contain rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                                      <Palette className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                  {chapter.branding.secondary_logo_url && (
                                    <img
                                      src={chapter.branding.secondary_logo_url}
                                      alt="Secondary logo"
                                      className="h-8 w-8 object-contain rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>

                            {/* Colors */}
                            <td className="p-3">
                              {chapter.hasBranding && chapter.branding ? (
                                <div className="flex items-center gap-2">
                                  {chapter.branding.primary_color && (
                                    <div
                                      className="h-6 w-6 rounded border border-gray-300"
                                      style={{ backgroundColor: chapter.branding.primary_color }}
                                      title={`Primary: ${chapter.branding.primary_color}`}
                                    />
                                  )}
                                  {chapter.branding.accent_color && (
                                    <div
                                      className="h-6 w-6 rounded border border-gray-300"
                                      style={{ backgroundColor: chapter.branding.accent_color }}
                                      title={`Accent: ${chapter.branding.accent_color}`}
                                    />
                                  )}
                                  {!chapter.branding.primary_color &&
                                    !chapter.branding.accent_color && (
                                      <span className="text-sm text-gray-400">—</span>
                                    )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>

                            {/* Updated */}
                            <td className="p-3">
                              {chapter.hasBranding && chapter.branding ? (
                                <div className="text-sm text-gray-600">
                                  {new Date(chapter.branding.updated_at).toLocaleDateString()}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                {chapter.hasBranding && chapter.branding ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleView(chapter.branding as BrandingRecord)}
                                      className="hover:bg-blue-50 hover:text-blue-600"
                                      title="View Branding"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(chapter.id)}
                                      className="hover:bg-purple-50 hover:text-purple-600"
                                      title="Edit Branding"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCreateBranding(chapter.id)}
                                    className="hover:bg-green-50 hover:text-green-600"
                                    title="Create Branding"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Create
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      <p>
                        Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                        {Math.min(currentPage * pageSize, total)} of {total} chapters
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Branding Modal */}
      {isViewModalOpen && viewingBranding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setIsViewModalOpen(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Branding Preview</h3>
                  <p className="text-sm text-gray-600">
                    {viewingBranding.chapter?.name || 'Chapter Branding'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <BrandingPreview branding={brandingToTheme(viewingBranding)} />
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleEdit(viewingBranding.chapter_id);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Branding
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

