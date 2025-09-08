'use client';

import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useProfile } from '@/lib/hooks/useProfile';
import { Clock, AlertCircle } from 'lucide-react';
import { WelcomeModal } from '@/components/WelcomeModal';
import { useState, useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (profile?.member_status === 'active') {
      setShowWelcome(true);
    }
  }, [profile?.member_status]);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  const handleResubmit = async () => {
    if (!profile?.id) return;
    
    try {
      const response = await fetch('/api/profile/resubmit-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id })
      });

      if (response.ok) {
        // Refresh the page to update the profile status
        window.location.reload();
      }
    } catch (error) {
      console.error('Error resubmitting membership:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show paywall for pending members
  if (profile?.member_status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Clock className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Pending</h2>
            <p className="text-gray-600">
              Your membership application is currently under review by the chapter administration. 
              You'll receive an email notification once your application has been processed.
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>What happens next?</strong><br />
              The chapter president will review your application and either approve or decline your membership. 
              This process typically takes 1-3 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show declined members screen
  if (profile?.member_status === 'declined') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Declined</h2>
            <p className="text-gray-600 mb-4">
              Unfortunately, your membership application to {profile?.chapter || 'the chapter'} was not approved at this time.
            </p>
            <p className="text-gray-600 mb-6">
              This could be due to various factors such as incomplete information, chapter capacity, or other considerations.
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>What can you do?</strong><br />
              You can resubmit your application for reconsideration. Make sure to provide complete and accurate information.
            </p>
          </div>
          <button
            onClick={handleResubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Resubmit Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Always show the header */}
      <DashboardHeader />
      
      {/* Wrap the main content with SubscriptionPaywall */}
      <SubscriptionPaywall>
        <main className="flex-1">
          {children}
        </main>
      </SubscriptionPaywall>
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleWelcomeClose}
        memberName={profile?.full_name || profile?.first_name || undefined}
        chapterName={profile?.chapter || undefined}
      />
    </div>
  );
}