'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { MetricType, UserGrowthFilters, UserListResponse, UserListItem } from '@/types/user-growth';

export interface UserGrowthTableRef {
  exportCsv: () => Promise<void>;
}

interface UserGrowthTableProps {
  metricType: MetricType;
  filters: UserGrowthFilters;
  /** When 'drawer', table body scrolls and pagination is sticky; export button is not rendered (caller puts it in header). */
  variant?: 'default' | 'drawer';
}

export const UserGrowthTable = forwardRef<UserGrowthTableRef, UserGrowthTableProps>(function UserGrowthTable(
  { metricType, filters, variant = 'default' },
  ref
) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 50;

  useEffect(() => {
    loadUsers();
  }, [metricType, filters, page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('metric_type', metricType);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.activityWindow) params.append('activity_window', filters.activityWindow.toString());

      const response = await fetch(`/api/developer/user-growth/users?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load users');
      
      const data: UserListResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('metric_type', metricType);
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.activityWindow) params.append('activity_window', filters.activityWindow.toString());

      const response = await fetch(`/api/developer/user-growth/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-growth-${metricType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    exportCsv: handleExport,
  }), [metricType, filters.chapterId, filters.startDate, filters.endDate, filters.activityWindow]);

  const tableContent = loading ? (
    <div className="text-center py-8">Loading users...</div>
  ) : (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Chapter</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Chapter Role</TableHead>
            <TableHead>Member Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.chapter_name || '-'}</TableCell>
                <TableCell>{user.role || '-'}</TableCell>
                <TableCell>{user.chapter_role || '-'}</TableCell>
                <TableCell>{user.member_status || '-'}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {user.last_active_at
                    ? new Date(user.last_active_at).toLocaleDateString()
                    : '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  const pagination = totalPages > 1 ? (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  ) : null;

  if (variant === 'drawer') {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 min-h-0 overflow-auto">
          {tableContent}
        </div>
        {pagination && (
          <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
            {pagination}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} className="rounded-full">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      {tableContent}
      {pagination}
    </div>
  );
});
