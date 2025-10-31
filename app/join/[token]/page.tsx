'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, Users, Shield, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinForm } from '@/components/features/join/JoinForm';
import { Invitation } from '@/types/invitations';
import { logger } from "@/lib/utils/logger";

export default function JoinPage() {
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
        logger.error('Error validating invitation:', { context: [error] });
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
      setTimeout(() => {
        // Force a page reload to ensure session is properly established
        window.location.href = '/dashboard';
      }, 1000); // Reduced delay
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
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900">Loading Statistics</h3>
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
              <span>Invalid Invitation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {error || 'This invitation link is invalid or has expired.'}
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Possible reasons:</p>
              <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
                <li>The invitation has expired</li>
                <li>The invitation has been deactivated</li>
                <li>The invitation has reached its usage limit</li>
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
              <span>Welcome to {invitation.chapter_name}!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your account has been created successfully. You can now access the chapter dashboard.
            </p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showJoinForm) {
    return (
      <JoinForm
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
            <CardTitle className="text-center text-2xl">
              Join {invitation.chapter_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You've been invited to join {invitation.chapter_name}. 
                Create your account to get started.
              </p>
            </div>

            {/* Invitation Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Invitation Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {invitation.usage_count} people have already joined
                    {invitation.max_uses && ` (${invitation.max_uses} max)`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {invitation.approval_mode === 'auto' ? 'Auto-approved' : 'Requires admin approval'}
                  </span>
                </div>
                
                {invitation.expires_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">
                    Open to all email domains
                  </span>
                </div>
              </div>
            </div>

            {/* Important Note */}
            {invitation.single_use && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Single-Use Per Email</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Each email address can only use this invitation once. Make sure to use your correct email address.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleStartJoin}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Create Account & Join Chapter
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
