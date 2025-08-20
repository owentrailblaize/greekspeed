'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';

interface CreateUserFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserForm({ onClose, onSuccess }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    chapter: '',
    role: 'active_member' as 'admin' | 'active_member' | 'alumni',
    is_developer: false,
    developer_permissions: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  
  // Use the chapters hook to fetch available chapters
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.chapter) {
        throw new Error('Email, firstName, lastName, and chapter are required');
      }

      const response = await fetch('/api/developer/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          chapter: formData.chapter,
          role: formData.role,
          is_developer: formData.is_developer,
          developer_permissions: formData.developer_permissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      setCreatedUser(data.user);
      setTempPassword(data.tempPassword);
      setSuccess(true);
      
      // Refresh the users list
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create user'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-green-600">User Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">User Details:</h3>
              <p><strong>Name:</strong> {createdUser.full_name}</p>
              <p><strong>Email:</strong> {createdUser.email}</p>
              <p><strong>Chapter:</strong> {createdUser.chapter}</p>
              <p><strong>Role:</strong> {createdUser.role}</p>
              <p><strong>Developer Access:</strong> {createdUser.is_developer ? 'Yes' : 'No'}</p>
              {createdUser.is_developer && (
                <p><strong>Permissions:</strong> {createdUser.developer_permissions?.length || 0} permissions</p>
              )}
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">Temporary Password:</h3>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border flex-1 font-mono">
                  {tempPassword}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyToClipboard(tempPassword)}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Share this password with the user. They should change it on first login.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Next Steps:</h3>
              <p className="text-sm text-blue-700">
                The user can now sign in with their email and this temporary password. 
                They will be guided through the onboarding process to complete their profile.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Create New User</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="user@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="chapter">Chapter *</Label>
              <Select 
                value={formData.chapter} 
                onValueChange={(value) => setFormData({ ...formData, chapter: value })}
              >
                <SelectItem value="">
                  {chaptersLoading ? 'Loading chapters...' : 'Select your chapter'}
                </SelectItem>
                {chapters.map((chapterData) => (
                  <SelectItem key={chapterData.id} value={chapterData.name}>
                    {chapterData.name}
                  </SelectItem>
                ))}
              </Select>
              {chaptersError && (
                <p className="text-red-500 text-xs">Failed to load chapters. Please refresh the page.</p>
              )}
              {chapters.length === 0 && !chaptersLoading && (
                <p className="text-yellow-500 text-xs">No chapters available. Please contact support.</p>
              )}
            </div>

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'active_member' | 'alumni' })}
              >
                <SelectItem value="">
                  Select your role
                </SelectItem>
                <SelectItem value="admin">Admin / Executive</SelectItem>
                <SelectItem value="active_member">Active Member</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_developer"
                checked={formData.is_developer}
                onCheckedChange={(checked) => setFormData({ ...formData, is_developer: checked as boolean })}
              />
              <Label htmlFor="is_developer">Developer Access</Label>
            </div>

            {formData.is_developer && (
              <div className="space-y-2">
                <Label>Developer Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['view_users', 'view_analytics', 'create_endpoints', 'manage_chapters', 'manage_permissions', 'view_system_health', 'manage_onboarding'].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={formData.developer_permissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              developer_permissions: [...formData.developer_permissions, permission]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              developer_permissions: formData.developer_permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.email || !formData.firstName || !formData.lastName || !formData.chapter}>
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}