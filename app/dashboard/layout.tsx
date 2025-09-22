'use client';

import SubscriptionPaywall from '@/components/SubscriptionPaywall';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useActivityTracking } from '@/lib/hooks/useActivityTracking';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize activity tracking for all dashboard pages
  useActivityTracking()

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
    </div>
  );
} 