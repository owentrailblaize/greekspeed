'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectItem } from '@/components/ui/select';
import { 
  Search, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Instagram,
  Phone,
  ArrowLeft,
  ArrowUpRight
} from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Recruit, RecruitStage, UpdateRecruitRequest } from '@/types/recruitment';
import { FeatureGuard } from '@/components/shared/FeatureGuard';
import { useRouter, usePathname } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';

interface RecruitsResponse {
  data: Recruit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STAGE_COLORS: Record<RecruitStage, string> = {
  'New': 'bg-blue-100 text-blue-800 border-blue-200',
  'Contacted': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Event Invite': 'bg-purple-100 text-purple-800 border-purple-200',
  'Bid Given': 'bg-orange-100 text-orange-800 border-orange-200',
  'Accepted': 'bg-green-100 text-green-800 border-green-200',
  'Declined': 'bg-red-100 text-red-800 border-red-200',
};

const STAGE_OPTIONS: RecruitStage[] = [
  'New',
  'Contacted',
  'Event Invite',
  'Bid Given',
  'Accepted',
  'Declined',
];

// Add skeleton loader component
function RecruitmentTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-center space-x-4 py-3 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-28"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-8 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecruitmentView() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useProfile();
  const { getAuthHeaders } = useAuth();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<RecruitStage | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  
  // Inline editing state
  const [editingRecruitId, setEditingRecruitId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    stage: RecruitStage;
    notes: string;
  } | null>(null);
  const [savingRecruitId, setSavingRecruitId] = useState<string | null>(null);

  // Check if we're on the standalone recruitment page
  const isStandalonePage = pathname === '/mychapter/recruitment';

  // Fetch recruits from API
  const fetchRecruits = useCallback(async () => {
    if (!profile?.chapter_id) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      });

      if (selectedStage !== 'all') {
        params.append('stage', selectedStage);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const headers = getAuthHeaders();
      const response = await fetch(`/api/recruitment/recruits?${params.toString()}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch recruits' }));
        throw new Error(errorData.error || 'Failed to fetch recruits');
      }

      const data: RecruitsResponse = await response.json();
      setRecruits(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching recruits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recruits');
      setRecruits([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.chapter_id, currentPage, selectedStage, searchQuery, getAuthHeaders]);

  // Reset to page 1 when filters change (but not on initial mount)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedStage, searchQuery]);

  // Fetch recruits when filters or page change
  useEffect(() => {
    if (profile?.chapter_id) {
      fetchRecruits();
    }
  }, [profile?.chapter_id, fetchRecruits]);

  // Format phone number for display
  const formatPhoneNumber = (phone: string | null | undefined): string => {
    if (!phone) return '—';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Handle stage change
  const handleStageChange = (recruitId: string, newStage: RecruitStage) => {
    if (!editingData) {
      const recruit = recruits.find(r => r.id === recruitId);
      if (recruit) {
        setEditingRecruitId(recruitId);
        setEditingData({
          stage: recruit.stage,
          notes: recruit.notes || '',
        });
      }
    } else if (editingRecruitId === recruitId) {
      setEditingData({ ...editingData, stage: newStage });
    }
  };

  // Handle notes change
  const handleNotesChange = (recruitId: string, newNotes: string) => {
    if (!editingData) {
      const recruit = recruits.find(r => r.id === recruitId);
      if (recruit) {
        setEditingRecruitId(recruitId);
        setEditingData({
          stage: recruit.stage,
          notes: recruit.notes || '',
        });
      }
    } else if (editingRecruitId === recruitId) {
      setEditingData({ ...editingData, notes: newNotes });
    }
  };

  // Handle save
  const handleSave = async (recruitId: string) => {
    if (!editingData || editingRecruitId !== recruitId) return;

    setSavingRecruitId(recruitId);
    setError(null);

    try {
      const recruit = recruits.find(r => r.id === recruitId);
      if (!recruit) return;

      // Build update payload with only changed fields
      const updatePayload: UpdateRecruitRequest = {};
      
      if (editingData.stage !== recruit.stage) {
        updatePayload.stage = editingData.stage;
      }
      if (editingData.notes !== (recruit.notes || '')) {
        updatePayload.notes = editingData.notes || undefined;
      }

      // If no changes, just exit edit mode
      if (Object.keys(updatePayload).length === 0) {
        setEditingRecruitId(null);
        setEditingData(null);
        setSavingRecruitId(null);
        return;
      }

      const headers = getAuthHeaders();
      const response = await fetch(`/api/recruitment/recruits/${recruitId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update recruit' }));
        throw new Error(errorData.error || 'Failed to update recruit');
      }

      const updatedRecruit: Recruit = await response.json();
      
      // Update local state
      setRecruits(prevRecruits =>
        prevRecruits.map(r => r.id === recruitId ? updatedRecruit : r)
      );
      
      // Exit edit mode
      setEditingRecruitId(null);
      setEditingData(null);
    } catch (err: any) {
      console.error('Error updating recruit:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setSavingRecruitId(null);
    }
  };

  // Handle cancel
  const handleCancel = (recruitId: string) => {
    if (editingRecruitId === recruitId) {
      setEditingRecruitId(null);
      setEditingData(null);
    }
  };

  return (
    <FeatureGuard flagName="recruitment_crm_enabled">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Only show Back button on standalone page */}
            {isStandalonePage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2 rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
            )}
            <h2 className="text-2xl font-bold text-gray-900">Recruitment CRM</h2>
            <p className="text-gray-600 mt-1">Manage and track potential recruits</p>
          </div>
          {/* Only show View Full Page button when NOT on standalone page (i.e., in exec dashboard) */}
          {!isStandalonePage && (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/mychapter/recruitment')}
                className="flex items-center space-x-2 rounded-full"
              >
                <span>View Full Page</span>
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Show loading skeleton immediately when loading or when profile is not yet available */}
        {(loading || !profile?.chapter_id) && (
          <div className="space-y-6">
            {/* Filters Skeleton */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-full sm:w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <RecruitmentTableSkeleton />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Only render content when not loading and profile is available */}
        {!loading && profile?.chapter_id && (
          <>
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or hometown..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Stage Filter */}
                  <div className="w-full sm:w-48">
                    <Select
                      value={selectedStage}
                      onValueChange={(value) => setSelectedStage(value as RecruitStage | 'all')}
                      placeholder="Filter by stage"
                    >
                        {STAGE_OPTIONS.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                            {stage}
                        </SelectItem>
                        ))}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table Section - No Card Wrapper */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Table Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {loading ? (
                    <span className="inline-flex items-center">
                      Recruits
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-2" />
                    </span>
                  ) : (
                    `Recruits (${pagination.total})`
                  )}
                </h3>
              </div>

              {/* Table Content */}
              <div className="p-6">
                {/* Loading State with Skeleton */}
                {loading && (
                  <div className="space-y-4">
                    <RecruitmentTableSkeleton />
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchRecruits} variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && recruits.length === 0 && (
                  <div className="text-center py-12">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg font-medium mb-2">No recruits found</p>
                    <p className="text-gray-500">
                      {searchQuery || selectedStage !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Get started by submitting your first recruit'}
                    </p>
                  </div>
                )}

                {/* Table */}
                {!loading && !error && recruits.length > 0 && (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Hometown</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Instagram</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recruits.map((recruit) => {
                          const isEditing = editingRecruitId === recruit.id;
                          const isSaving = savingRecruitId === recruit.id;
                          const currentStage = isEditing && editingData 
                            ? editingData.stage 
                            : recruit.stage;
                          const currentNotes = isEditing && editingData 
                            ? editingData.notes 
                            : (recruit.notes || '');

                          return (
                            <TableRow
                              key={recruit.id}
                              className="hover:bg-gray-50"
                            >
                              <TableCell className="font-medium">{recruit.name}</TableCell>
                              <TableCell>{recruit.hometown}</TableCell>
                              <TableCell>
                                {recruit.phone_number ? (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <span>{formatPhoneNumber(recruit.phone_number)}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {recruit.instagram_handle ? (
                                  <a
                                    href={`https://instagram.com/${recruit.instagram_handle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                  >
                                    <Instagram className="h-3 w-3" />
                                    <span>@{recruit.instagram_handle}</span>
                                  </a>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="w-48">
                                    <Select
                                      value={currentStage}
                                      onValueChange={(value) => handleStageChange(recruit.id, value as RecruitStage)}
                                    >
                                      {STAGE_OPTIONS.map((stage) => (
                                        <SelectItem key={stage} value={stage}>
                                          {stage}
                                        </SelectItem>
                                      ))}
                                    </Select>
                                  </div>
                                ) : (
                                  <Badge
                                    className={`${STAGE_COLORS[recruit.stage]} border cursor-pointer`}
                                    onClick={() => {
                                      setEditingRecruitId(recruit.id);
                                      setEditingData({
                                        stage: recruit.stage,
                                        notes: recruit.notes || '',
                                      });
                                    }}
                                  >
                                    {recruit.stage}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={currentNotes}
                                      onChange={(e) => handleNotesChange(recruit.id, e.target.value)}
                                      placeholder="Add notes..."
                                      className="min-h-[60px] w-full text-sm"
                                      disabled={isSaving}
                                    />
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCancel(recruit.id)}
                                        disabled={isSaving}
                                        className="h-7 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSave(recruit.id)}
                                        disabled={isSaving}
                                        className="h-7 text-xs"
                                      >
                                        {isSaving ? (
                                          <>
                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                            Saving...
                                          </>
                                        ) : (
                                          'Save'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[40px]"
                                    onClick={() => {
                                      setEditingRecruitId(recruit.id);
                                      setEditingData({
                                        stage: recruit.stage,
                                        notes: recruit.notes || '',
                                      });
                                    }}
                                  >
                                    {recruit.notes ? (
                                      <p className="whitespace-pre-wrap">{recruit.notes}</p>
                                    ) : (
                                      <p className="text-gray-400 italic">Click to add notes...</p>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {!loading && !error && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} recruits
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {pagination.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={currentPage === pagination.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Error state */}
        {error && !loading && profile?.chapter_id && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRecruits} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </div>
    </FeatureGuard>
  );
}

