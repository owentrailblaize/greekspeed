'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Users, Shield, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinForm } from '@/components/features/join/JoinForm';
import { Invitation } from '@/types/invitations';

export default function JoinPageClient() {
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
        const response = await fetch(`/api/join/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid invitation');
        }

        const data = await response.json();
        
        if (!data.valid) {
          throw new Error(data.error || 'Invalid invitation');
        }

        setInvitation(data.invitation);
      } catch (error) {
        console.error('Error validating invitation:', error);
        setError(error instanceof Error ? error.message : 'Failed to validate invitation');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900">Loading Invitation</h3>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Invalid Invitation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>This could happen if:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>The invitation has expired</li>
                <li>The invitation has been deactivated</li>
                <li>The invitation has reached its usage limit</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signupSuccess && !invitation.approval_mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Welcome to {invitation.chapter_name}!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your account has been created successfully. Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showJoinForm && invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <JoinForm
            invitation={invitation}
            onSuccess={handleJoinSuccess}
            onCancel={() => setShowJoinForm(false)}
          />
        </div>
      </div>
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
              <span>Join {invitation.chapter_name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-gray-600 mb-4">
                You've been invited to join {invitation.chapter_name} as an active member. 
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
                    {invitation.usage_count} {invitation.usage_count === 1 ? 'person has' : 'people have'} already joined
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
