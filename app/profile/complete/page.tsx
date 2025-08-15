'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Phone, MapPin } from 'lucide-react';

const userRoles = [
  { value: 'admin', label: 'Admin / Executive' },
  { value: 'active_member', label: 'Active Member' },
  { value: 'alumni', label: 'Alumni' }
];

const chapters = [
  'Alpha Chapter',
  'Beta Chapter', 
  'Gamma Chapter',
  'Delta Chapter',
  'Epsilon Chapter'
];

export default function ProfileCompletionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chapter, setChapter] = useState('');
  const [role, setRole] = useState('active_member');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/sign-up');
      return;
    }

    // Check if profile is already complete
    const checkProfileCompletion = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('chapter, role')
          .eq('id', user.id)
          .single();

        if (profile?.chapter && profile?.role) {
          // Profile is complete, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      }
    };

    checkProfileCompletion();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapter || !role) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the existing profile with all information
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          chapter,
          role,
          bio: bio || null,        // Save bio (optional)
          phone: phone || null,     // Save phone (optional)
          location: location || null, // Save location (optional)
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // Redirect to dashboard after successful profile completion
      router.push('/dashboard');
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="text-gray-600">Welcome! Please complete your profile to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Required Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter *</Label>
                <Select value={chapter} onValueChange={setChapter}>
                  <SelectItem value="">Select your chapter</SelectItem>
                  {chapters.map((chapterName) => (
                    <SelectItem key={chapterName} value={chapterName}>
                      {chapterName}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  {userRoles.map((userRole) => (
                    <SelectItem key={userRole.value} value={userRole.value}>
                      {userRole.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Additional Information (Optional)</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="bio">Bio</Label>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
              </div>

              {/* Phone and Location on the same row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="phone">Phone</Label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="location">Location</Label>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Optional</span>
                  </div>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Enter city, state"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-navy-600 hover:bg-navy-700" 
              disabled={loading}
            >
              {loading ? 'Updating Profile...' : 'Complete Profile & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 