'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { DEVELOPER_PERMISSIONS } from '@/lib/developerPermissions';
import { DeveloperPermission } from '@/types/profile';

interface CreateUserFormProps {
  onClose: () => void;
  onSuccess: () => void;
  chapterContext?: {
    chapterId: string;
    chapterName: string;
    isChapterAdmin?: boolean;
  };
}

export function CreateUserForm({ onClose, onSuccess, chapterContext }: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    chapter: chapterContext?.chapterId || '',
    role: 'active_member' as 'admin' | 'active_member',
    chapter_role: 'member' as 'member' | 'president' | 'vice_president' | 'social_chair' | 'treasurer',
    is_developer: false
    // Remove developer_permissions from state since it's auto-assigned
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState('');
  
  // Use the chapters hook to fetch available chapters
  const { chapters, loading: chaptersLoading, error: chaptersError } = useChapters();

  // Auto-populate chapter if provided
  useEffect(() => {
    if (chapterContext && chapterContext.isChapterAdmin) {
      setFormData(prev => ({ ...prev, chapter: chapterContext.chapterId }));
    }
  }, [chapterContext]);

  // Add this debug log at the top of the component
  // CreateUserForm render - success state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Starting user creation...

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
          chapter_role: formData.chapter_role,
          is_developer: formData.is_developer,
          // Remove developer_permissions from the body
        })
      });

      // API Response status

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const data = await response.json();
      // API Response data
      
      setCreatedUser(data.user);
      setTempPassword(data.tempPassword);
      setSuccess(true);
      
      // Success state set to true
      
      // DON'T call onSuccess() here - let the success modal handle it
      // onSuccess(); // Remove this line
      
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
    // Rendering success modal
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
              {/* Remove developer permissions display */}
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
              <Button onClick={() => {
                setSuccess(false); // Reset success state
                onSuccess(); // Call onSuccess when closing the modal
                onClose(); // Close the modal
              }}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Create New User</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Email Field - Full Width */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>

          {/* First Name and Last Name - Same Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          {/* Chapter Field - Full Width */}
          {chapterContext ? (
            <div>
              <Label htmlFor="chapter">Chapter *</Label>
              <Input
                id="chapter"
                value={chapterContext.chapterName}
                disabled
                className="bg-gray-100"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="chapter">Chapter *</Label>
              <Select 
                value={formData.chapter} 
                onValueChange={(value: string) => setFormData({ ...formData, chapter: value })}
              >
                {chapters.map((chapterData) => (
                  <SelectItem key={chapterData.id} value={chapterData.id}>
                    {chapterData.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          )}

          {/* Role and Chapter Role - Same Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string) => {
                  const newRole = value as 'admin' | 'active_member';
                  setFormData({ 
                    ...formData, 
                    role: newRole,
                    // Auto-set chapter role to president when admin/executive is selected
                    chapter_role: newRole === 'admin' ? 'president' : 'member'
                  });
                }}
              >
                <SelectItem value="active_member">Active Member</SelectItem>
                <SelectItem value="admin">Admin / Executive</SelectItem>
              </Select>
            </div>
            <div>
              <Label htmlFor="chapter_role">Chapter Role *</Label>
              <Select 
                value={formData.chapter_role} 
                onValueChange={(value: string) => setFormData({ ...formData, chapter_role: value as any })}
              >
                <SelectItem value="member">General Member</SelectItem>
                <SelectItem value="president">President</SelectItem>
                <SelectItem value="vice_president">Vice President</SelectItem>
                <SelectItem value="social_chair">Social Chair</SelectItem>
                <SelectItem value="treasurer">Treasurer</SelectItem>
              </Select>
            </div>
          </div>

          {/* Developer Access - Only show if not chapter context */}
          {!chapterContext?.isChapterAdmin && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_developer"
                  checked={formData.is_developer}
                  onCheckedChange={(checked) => {
                    const isDev = checked as boolean;
                    setFormData({ 
                      ...formData, 
                      is_developer: isDev,
                      // Auto-set role to admin when developer access is enabled
                      role: isDev ? 'admin' : 'active_member'
                    });
                  }}
                />
                <Label htmlFor="is_developer">Developer Access</Label>
              </div>

              {formData.is_developer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Full Developer Access</p>
                      <p className="text-xs text-blue-600 mt-1">
                        This user will have access to all developer permissions.
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Role automatically set to "Admin / Executive" for developer access.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}