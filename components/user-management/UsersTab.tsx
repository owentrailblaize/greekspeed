'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { CreateUserForm } from './CreateUserForm';
import { DeleteUserModal } from './DeleteUserModal';

interface User {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  chapter_role: string | null;
  member_status: string | null;
  pledge_class: string | null;
  grad_year: number | null;
  major: string | null;
  minor: string | null;
  hometown: string | null;
  gpa: number | null;
  chapter_id: string | null;
  is_developer: boolean;
  developer_permissions: string[];
  access_level: string | null;
}

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/developer/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
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
      setDeletingUserId(userToDelete.id);
      
      const response = await fetch(`/api/developer/users?userId=${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      const result = await response.json();
      console.log('User deleted successfully:', result);
      
      // Remove the user from the local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      
      // Close modal and show success message
      closeDeleteModal();
      
      // Show success message (you could replace this with a toast notification)
      alert(`User "${userToDelete.email}" has been deleted successfully.`);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.chapter && user.chapter.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'alumni': return 'secondary';
      case 'active_member': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Create and manage user accounts</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create User</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users by email, name, role, or chapter..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>All Users ({filteredUsers.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-sm">User Info</th>
                    <th className="text-left p-3 font-medium text-sm">Role & Status</th>
                    <th className="text-left p-3 font-medium text-sm">Chapter</th>
                    <th className="text-left p-3 font-medium text-sm">Contact</th>
                    <th className="text-left p-3 font-medium text-sm">Academic</th>
                    <th className="text-left p-3 font-medium text-sm">Developer</th>
                    <th className="text-left p-3 font-medium text-sm">Created</th>
                    <th className="text-left p-3 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{user.full_name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Name not set'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {user.member_status || 'N/A'}
                          </Badge>
                          {user.chapter_role && (
                            <p className="text-xs text-gray-600">{user.chapter_role}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{user.chapter || 'N/A'}</p>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {user.phone && <p className="text-sm">{user.phone}</p>}
                          {user.location && <p className="text-sm">{user.location}</p>}
                          {!user.phone && !user.location && <p className="text-xs text-gray-500">No contact info</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {user.major && <p className="text-sm">{user.major}</p>}
                          {user.grad_year && <p className="text-sm">Class of {user.grad_year}</p>}
                          {!user.major && !user.grad_year && <p className="text-xs text-gray-500">No academic info</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        {user.is_developer ? (
                          <div className="space-y-1">
                            <Badge variant="secondary">Developer</Badge>
                            <p className="text-xs text-gray-600">
                              {user.developer_permissions?.length || 0} permissions
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.access_level || 'N/A'} access
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Standard user</p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{formatDate(user.created_at)}</p>
                        <p className="text-xs text-gray-500">Updated: {formatDate(user.updated_at)}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openDeleteModal(user)}
                            disabled={deletingUserId === user.id}
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
          )}
        </CardContent>
      </Card>

      {/* Create User Form */}
      {showCreateForm && (
        <CreateUserForm onClose={() => setShowCreateForm(false)} onSuccess={fetchUsers} />
      )}

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteUser}
        user={userToDelete}
        isDeleting={deletingUserId === userToDelete?.id}
      />
    </div>
  );
}
