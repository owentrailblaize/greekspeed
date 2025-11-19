'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { execColumns } from '@/components/user-management/columns';
import { ViewUserModal } from '@/components/user-management/ViewUserModal';
import { EditUserModal } from '@/components/user-management/EditUserModal';
import { DeleteUserModal } from '@/components/user-management/DeleteUserModal';
import { AddMemberForm } from '@/components/chapter/AddMemberForm';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string | null;
  chapter_role: string | null;
  member_status: string | null;
  chapter?: string | null;
  created_at?: string;
  updated_at?: string;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  pledge_class?: string | null;
  grad_year?: number | null;
  major?: string | null;
  minor?: string | null;
  hometown?: string | null;
  gpa?: number | null;
  chapter_id?: string | null;
  is_developer?: boolean;
  developer_permissions?: string[];
  access_level?: string | null;
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

  // Modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Modal handlers
  const openViewModal = (user: User) => {
    setUserToView(user);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setUserToView(null);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setUserToEdit(null);
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/developer/users?userId=${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      // Remove the user from the local state
      setAllFilteredUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      
      // Recalculate pagination
      const updatedTotal = allFilteredUsers.length - 1;
      setTotalUsers(updatedTotal);
      setTotalPages(Math.ceil(updatedTotal / pageSize));
      
      // Close modal and show success message
      closeDeleteModal();
      toast.success(`User "${userToDelete.email}" has been deleted successfully.`);
      
      // Refresh the user list
      await fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUserSaved = () => {
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      {/* Main Card Container - All content inline */}
      <Card className="w-full bg-white/80 backdrop-blur-md border border-navy-100/50 shadow-lg shadow-navy-100/20">
        <CardHeader className="pb-4 border-b border-navy-100/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold text-navy-900">Members</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage chapter members</p>
            </div>
            <Button 
              onClick={() => setShowAddMemberModal(true)}
              className="rounded-full bg-white/80 backdrop-blur-md border border-navy-500/50 shadow-lg shadow-navy-100/20 hover:shadow-xl hover:shadow-navy-100/30 hover:bg-white/90 text-navy-700 hover:text-navy-900 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search - Now inside the card */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users by email, name, role, or chapter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users Table - Simplified since card wrapper is removed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-navy-900">
                Chapter Members ({totalUsers.toLocaleString()})
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div
                  className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"
                  aria-label="Loading"
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr className="border-b">
                        {execColumns.map((col) => (
                          <th key={col.key} className={`text-left p-3 font-medium text-sm bg-gray-50 ${col.className || ''}`}>
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          {execColumns.map((col) => (
                            <td key={col.key} className={`p-3 ${col.className || ''}`}>
                              {col.key === 'actions'
                                ? (
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => openViewModal(u)}
                                      className="hover:bg-blue-50 hover:text-blue-600"
                                      title="View user details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(u)}
                                      className="h-8 w-8 p-0"
                                      title="Edit user"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => openDeleteModal(u)}
                                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                      title="Delete user"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )
                                : (col.render ? col.render(u) : (u as any)[col.key] ?? 'N/A')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Now inside the card */}
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
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberForm
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            setShowAddMemberModal(false);
            handleUserSaved();
          }}
          chapterContext={{
            chapterId: chapterId || '',
            chapterName: profile?.chapter || '',
            isChapterAdmin: true
          }}
        />
      )}

      {/* View User Modal */}
      {viewModalOpen && typeof window !== 'undefined' && userToView && createPortal(
        <ViewUserModal
          isOpen={viewModalOpen}
          onClose={closeViewModal}
          user={userToView as any}
        />,
        document.body
      )}

      {/* Edit User Modal */}
      {editModalOpen && typeof window !== 'undefined' && (
        <EditUserModal
          isOpen={editModalOpen}
          onClose={closeEditModal}
          user={userToEdit}
          onSaved={() => {
            handleUserSaved();
            closeEditModal();
          }}
        />
      )}

      {/* Delete User Modal */}
      {deleteModalOpen && typeof window !== 'undefined' && userToDelete && createPortal(
        <DeleteUserModal
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteUser}
          user={{
            email: userToDelete.email,
            full_name: userToDelete.full_name,
            role: userToDelete.role,
            chapter: userToDelete.chapter || null
          }}
          isDeleting={isDeleting}
        />,
        document.body
      )}
    </div>
  );
}

