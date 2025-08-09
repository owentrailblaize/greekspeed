'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { chapters } from '@/lib/mockAlumni';

// User roles for the dropdown
const userRoles = [
  { value: 'admin', label: 'Admin / Executive' },
  { value: 'active_member', label: 'Active Member' },
  { value: 'alumni', label: 'Alumni' }
];

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [chapter, setChapter] = useState('');
  const [role, setRole] = useState<'Admin / Executive' | 'Active Member' | 'Alumni' | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 SignUpPage: Auth state check:', { 
      authLoading, 
      hasUser: !!user,
      userId: user?.id 
    });

    if (!authLoading && user) {
      console.log('✅ SignUpPage: User already authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('🔍 SignUpPage: Attempting sign up for:', email);

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !chapter || !role) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, {
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        chapter,
        role
      });
      console.log('✅ SignUpPage: Sign up successful');
      setSuccess('Account created successfully! Redirecting...');
      
      // Wait a moment for the session to be established
      setTimeout(() => {
        console.log('🔍 SignUpPage: Redirecting to dashboard...');
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('❌ SignUpPage: Sign up failed:', error);
      setError(error instanceof Error ? error.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create Your Account</CardTitle>
          <p className="text-center text-sm text-gray-600">
            Join the fraternity network and connect with alumni
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Chapter Selection */}
            <div className="space-y-2">
              <Label htmlFor="chapter">Chapter</Label>
              <Select 
                value={chapter} 
                onValueChange={setChapter}
                placeholder="Select your chapter"
                className={loading ? "opacity-50 pointer-events-none" : ""}
              >
                {chapters.map((chapterName) => (
                  <SelectItem key={chapterName} value={chapterName}>
                    {chapterName}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={role} 
                onValueChange={(value: string) => setRole(value as 'Admin / Executive' | 'Active Member' | 'Alumni')}                placeholder="Select your role"
                className={loading ? "opacity-50 pointer-events-none" : ""}
              >
                {userRoles.map((userRole) => (
                  <SelectItem key={userRole.value} value={userRole.value}>
                    {userRole.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            {success && (
              <div className="text-green-500 text-sm">{success}</div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            {/* Sign In Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-navy-600 hover:text-navy-700 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 