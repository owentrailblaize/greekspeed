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
  Eye, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  UserPlus,
  Instagram,
  Phone,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Recruit, RecruitStage } from '@/types/recruitment';
import { FeatureGuard } from '@/components/shared/FeatureGuard';
import { useRouter } from 'next/navigation';

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

const STAGE_OPTIONS: Array<{ value: RecruitStage | 'all'; label: string }> = [
  { value: 'all', label: 'All Stages' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Event Invite', label: 'Event Invite' },
  { value: 'Bid Given', label: 'Bid Given' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Declined', label: 'Declined' },
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

  // Handle row click (placeholder for Milestone 3)
  const handleRowClick = (recruit: Recruit) => {
    // TODO: Navigate to detail view in Milestone 3
    console.log('View recruit:', recruit.id);
  };

  // Handle edit click (placeholder for Milestone 3)
  const handleEditClick = (e: React.MouseEvent, recruit: Recruit) => {
    e.stopPropagation();
    // TODO: Open edit modal in Milestone 3
    console.log('Edit recruit:', recruit.id);
  };

  return (
    <FeatureGuard flagName="recruitment_crm_enabled">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Recruitment CRM</h2>
            <p className="text-gray-600 mt-1">Manage and track potential recruits</p>
          </div>
        </div>

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
                  {STAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {loading ? (
                  <span className="inline-flex items-center">
                    Recruits
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-2" />
                  </span>
                ) : (
                  `Recruits (${pagination.total})`
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Hometown</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Instagram</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruits.map((recruit) => (
                      <TableRow
                        key={recruit.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick(recruit)}
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
                              onClick={(e) => e.stopPropagation()}
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
                          <Badge
                            className={`${STAGE_COLORS[recruit.stage]} border`}
                          >
                            {recruit.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {recruit.submitted_by_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(recruit.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditClick(e, recruit)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
          </CardContent>
        </Card>
      </div>
    </FeatureGuard>
  );
}

