import type { Metadata } from 'next';
import { validateInvitationToken } from '@/lib/utils/invitationUtils';

// Dynamic metadata generation for alumni invitation links
export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params;
  
  try {
    const validation = await validateInvitationToken(token);
    
    if (validation.valid && validation.invitation) {
      const chapterName = validation.chapter_name || 'Trailblaize';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
      
      return {
        title: `Join ${chapterName} Alumni on Trailblaize`,
        description: `You've been invited to join ${chapterName} as an alumni member. Connect with fellow graduates and stay involved.`,
        openGraph: {
          title: `Join ${chapterName} Alumni on Trailblaize`,
          description: `You've been invited to join ${chapterName} as an alumni member. Connect with fellow graduates and stay involved.`,
          url: `${baseUrl}/alumni-join/${token}`,
          siteName: 'Trailblaize',
          images: [
            {
              url: '/og/Trailblaize.png',
              width: 1200,
              height: 630,
              alt: `Join ${chapterName} Alumni on Trailblaize`,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `Join ${chapterName} Alumni on Trailblaize`,
          description: `You've been invited to join ${chapterName} as an alumni member. Connect with fellow graduates.`,
          images: ['/og/Trailblaize.png'],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata if invitation is invalid
  return {
    title: 'Join Trailblaize Alumni',
    description: 'Join your chapter alumni network on Trailblaize – Alumni Relationship Management',
    openGraph: {
      title: 'Join Trailblaize Alumni',
      description: 'Join your chapter alumni network on Trailblaize – Alumni Relationship Management',
      url: 'https://trailblaize.net',
      siteName: 'Trailblaize',
      images: [
        {
          url: '/og/Trailblaize.png',
          width: 1200,
          height: 630,
          alt: 'Join Trailblaize Alumni',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Join Trailblaize Alumni',
      description: 'Join your chapter alumni network on Trailblaize – Alumni Relationship Management',
      images: ['/og/Trailblaize.png'],
    },
  };
}

'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Users, Shield, Calendar, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlumniJoinForm } from '@/components/features/join/AlumniJoinForm';
import { Invitation } from '@/types/invitations';

export default function AlumniJoinPage() {
  const params = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showApprovalPending, setShowApprovalPending] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const token = params.token as string;

  useEffect(() => {
    const validateInvitation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/alumni-join/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid alumni invitation');
        }

        const data = await response.json();
        
        if (!data.valid) {
          throw new Error(data.error || 'Invalid alumni invitation');
        }

        setInvitation(data.invitation);
      } catch (error) {
        console.error('Error validating alumni invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to validate alumni invitation');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateInvitation();
    }
  }, [token]);

  const handleJoinSuccess = (userData: any) => {
    setSignupSuccess(true);
    
    if (userData.needs_approval) {
      setShowApprovalPending(true);
    } else {
      // Show success message and ensure session is ready before redirect
      window.location.href = '/dashboard';
    }
  };

  const handleStartJoin = () => {
    setShowJoinForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900">Loading Alumni Invitation</h3>
                <p className="text-xs text-gray-600">Fetching invitation data...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Invalid Alumni Invitation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {error || 'This alumni invitation link is invalid or has expired.'}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Possible reasons:</p>
              <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>The alumni invitation has expired</li>
                <li>The alumni invitation has been deactivated</li>
                <li>The alumni invitation has reached its usage limit</li>
                <li>The link was copied incorrectly</li>
              </ul>
            </div>
            <Button
              onClick={() => router.push('/')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signupSuccess && !invitation.approval_mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Welcome to {invitation.chapter_name} Alumni!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your alumni account has been created successfully. You can now access the alumni dashboard and connect with fellow alumni.
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Go to Alumni Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showJoinForm) {
    return (
      <AlumniJoinForm
        invitation={invitation}
        onSuccess={handleJoinSuccess}
        onCancel={() => setShowJoinForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl flex items-center justify-center space-x-2">
              <GraduationCap className="h-6 w-6 text-purple-600" />
              <span>Join {invitation.chapter_name} Alumni</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You've been invited to join {invitation.chapter_name} as an alumni member. 
                Create your alumni account to connect with fellow graduates and stay involved.
              </p>
            </div>

            {/* Alumni Invitation Details */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-purple-900 flex items-center space-x-2">
                <GraduationCap className="h-4 w-4" />
                <span>Alumni Invitation Details</span>
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800">
                    {invitation.usage_count} alumni have already joined
                    {invitation.max_uses && ` (${invitation.max_uses} max)`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-purple-800">
                    {invitation.approval_mode === 'auto' ? 'Auto-approved alumni membership' : 'Requires admin approval'}
                  </span>
                </div>
                
                {invitation.expires_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-purple-800">
                    Open to all email domains
                  </span>
                </div>
              </div>
            </div>

            {/* Alumni Benefits */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Alumni Benefits</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Connect with fellow alumni and current members</li>
                <li>• Access to alumni directory and networking opportunities</li>
                <li>• Stay updated on chapter events and news</li>
                <li>• Professional networking and career development resources</li>
              </ul>
            </div>

            {/* Important Note */}
            {invitation.single_use && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Single-Use Per Email</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      Each email address can only use this alumni invitation once. Make sure to use your correct email address.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleStartJoin}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              Create Account
            </Button>

            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Return to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
