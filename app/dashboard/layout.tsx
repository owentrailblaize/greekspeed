'use client';

import SubscriptionPaywall from '@/components/SubscriptionPaywall';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionPaywall>
      {children}
    </SubscriptionPaywall>
  );
} 