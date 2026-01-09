'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Palette, Search, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { BrandingForm } from '@/components/features/branding/BrandingForm';
import type { ChapterBranding } from '@/types/branding';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';

interface Chapter {
  id: string;
  name: string;
  chapter_name?: string;
  university?: string;
  location?: string;
}

/**
 * Developer Branding Management Page
 * 
 * Allows developers to manage branding for all chapters with a sidebar interface
 */
export default function DeveloperBrandingPage() {
  const router = useRouter();
  const { profile, isDeveloper } = useProfile();
  const { session } = useAuth();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [branding, setBranding] = useState<ChapterBranding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is a developer
  useEffect(() => {
    if (profile && !isDeveloper) {
      toast.error('Access denied. Developer access required.');
      router.push('/dashboard');
    }
  }, [profile, isDeveloper, router]);

  // Fetch all chapters
  const fetchChapters = useCallback(async () => {
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

      const response = await fetch('/api/developer/chapters?page=1&limit=100', {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }

      const data = await response.json();
      setChapters(data.chapters || []);
      setFilteredChapters(data.chapters || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load chapters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Filter chapters based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChapters(chapters);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chapters.filter(
        (chapter) =>
          chapter.name?.toLowerCase().includes(query) ||
          chapter.chapter_name?.toLowerCase().includes(query) ||
          chapter.university?.toLowerCase().includes(query) ||
          chapter.location?.toLowerCase().includes(query)
      );
      setFilteredChapters(filtered);
    }
  }, [searchQuery, chapters]);

  const handleChapterSelect = async (chapter: Chapter) => {
    try {
      setSelectedChapterId(chapter.id);
      setSelectedChapter(chapter);
      setLoadingBranding(true);
      setError(null);
      setBranding(null);

      // Fetch branding for selected chapter
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const brandingResponse = await fetch(`/api/branding/chapters/${chapter.id}`, {
        headers,
      });

      if (brandingResponse.ok) {
        const brandingData = await brandingResponse.json();
        setBranding(brandingData || null);
      } else if (brandingResponse.status === 404) {
        // No branding exists yet, that's okay
        setBranding(null);
      } else {
        const errorData = await brandingResponse.json().catch(() => ({ error: 'Failed to fetch branding' }));
        throw new Error(errorData.error || 'Failed to fetch branding');
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load branding';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleSubmit = async (data: Partial<ChapterBranding>) => {
    if (!selectedChapterId) return;

    try {
      setSubmitting(true);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/branding/chapters/${selectedChapterId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save branding');
      }

      const result = await response.json();
      setBranding(result.branding);
      toast.success(result.message || 'Branding saved successfully!');
    } catch (error) {
      console.error('Error submitting branding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save branding';
      toast.error(errorMessage);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedChapterId(null);
    setSelectedChapter(null);
    setBranding(null);
    setError(null);
  };

  // Permission check
  if (profile && !isDeveloper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the developer branding management.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-gray-600">Loading chapters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-6 w-6 text-brand-primary" />
                  <h1 className="text-3xl font-bold text-navy-900">Branding Management</h1>
                </div>
                <p className="text-gray-600 mt-1">Manage branding for all chapters</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Chapters List */}
          <div className="lg:col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Chapters</span>
                  <Badge variant="secondary" className="ml-auto">
                    {filteredChapters.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search chapters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Chapters List */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredChapters.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {searchQuery.trim() && chapters.length > 0
                        ? 'No chapters match your search.'
                        : 'No chapters found.'}
                    </p>
                  ) : (
                    filteredChapters.map((chapter) => (
                      <Button
                        key={chapter.id}
                        variant={selectedChapterId === chapter.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleChapterSelect(chapter)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">
                            {chapter.chapter_name || chapter.name}
                          </span>
                          {chapter.university && (
                            <span className="text-xs text-gray-500 mt-1">{chapter.university}</span>
                          )}
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area - Branding Form */}
          <div className="lg:col-span-8">
            {!selectedChapterId ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Palette className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Select a Chapter
                  </h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Choose a chapter from the sidebar to manage its branding settings, including
                    logos, colors, and visual identity.
                  </p>
                </CardContent>
              </Card>
            ) : loadingBranding ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary mb-4" />
                  <p className="text-gray-600">Loading branding...</p>
                </CardContent>
              </Card>
            ) : error && !branding ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Error Loading Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">{error}</p>
                  <div className="flex gap-3">
                    <Button onClick={handleCancel} variant="outline">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => selectedChapter && handleChapterSelect(selectedChapter)}
                      variant="default"
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <BrandingForm
                initialData={branding}
                chapterId={selectedChapterId}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

