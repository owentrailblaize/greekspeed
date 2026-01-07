'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Users, Shield, Calendar, CheckCircle, Loader2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlumniJoinForm } from '@/components/features/join/AlumniJoinForm';
import { Invitation } from '@/types/invitations';

export default function AlumniJoinPageClient() {
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

        // Additional safety check: Ensure this is an alumni invitation
        if (data.invitation?.invitation_type && data.invitation.invitation_type !== 'alumni') {
          // Redirect to the correct page based on invitation type
          if (data.invitation.invitation_type === 'active_member') {
            router.push(`/join/${token}`);
            return;
          }
          throw new Error('This invitation is not for alumni');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Join {invitation.chapter_name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                You've been invited to join {invitation.chapter_name} as an alumni member. 
                Create your account to get started.
              </p>
            </div>

            {/* Invitation Details */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Invitation Details</span>
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {invitation.usage_count} {invitation.usage_count === 1 ? 'alumni has' : 'alumni have'} already joined
                    {invitation.max_uses && ` (${invitation.max_uses} max)`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>
                    {invitation.approval_mode === 'auto' ? 'Auto-approved membership' : 'Requires admin approval'}
                  </span>
                </div>
                {invitation.expires_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {invitation.single_use && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Each email address can only use this invitation once. Make sure to use your correct email address.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleStartJoin}
                className="rounded-full flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
