'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { UsersTable } from '@/components/user-management/UsersTable';
import { execColumns } from '@/components/user-management/columns';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  chapter_role: string | null;
  member_status: string | null;
}

export function MembersView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize] = useState(10);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDebounced]);

  // Store all filtered users for pagination
  const [allFilteredUsers, setAllFilteredUsers] = useState<User[]>([]);

  // Fetch all users for the chapter, then filter client-side
  useEffect(() => {
    if (chapterId) {
      fetchUsers();
    }
  }, [chapterId, searchDebounced]);

  // Re-paginate when page changes
  useEffect(() => {
    if (allFilteredUsers.length > 0) {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = allFilteredUsers.slice(startIndex, endIndex);
      setUsers(paginatedUsers);
    }
  }, [currentPage, allFilteredUsers, pageSize]);

  const fetchUsers = async () => {
    if (!chapterId) return;
    
    try {
      setLoading(true);
      const q = searchDebounced ? `&q=${encodeURIComponent(searchDebounced)}` : '';
      
      // Fetch all users for the chapter (no role filter)
      const response = await fetch(`/api/developer/users?page=1&limit=1000&chapterId=${encodeURIComponent(chapterId)}${q}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const allUsers = data.users || [];
      
      // Filter to only active_member and admin roles
      const filteredUsers = allUsers.filter((user: User) => 
        user.role === 'active_member' || user.role === 'admin'
      );

      // Store all filtered users
      setAllFilteredUsers(filteredUsers);

      // Calculate pagination for filtered results
      const total = filteredUsers.length;
      setTotalUsers(total);
      setTotalPages(Math.ceil(total / pageSize));
      
      // Apply pagination to filtered results
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Members</h2>
          <p className="text-sm text-gray-600 mt-1">Manage chapter members</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users by email, name, role, or chapter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <UsersTable
        title={`Chapter Members (${totalUsers.toLocaleString()})`}
        users={users}
        loading={loading}
        columns={execColumns}
        renderActions={(user) => (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="hover:bg-blue-50 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        pagination={(
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              <p>Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers.toLocaleString()} users</p>
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
        )}
      />
    </div>
  );
}

