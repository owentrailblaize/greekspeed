'use client';
export const dynamic = "force-dynamic";

import { DashboardClient } from '@/components/DashboardClient';

export default function DashboardPage() {
  console.log('🔍 DashboardPage: Component rendering');
  return (
    <div>
      <div style={{ display: 'none' }}>Dashboard Page Wrapper</div>
      <DashboardClient />
    </div>
  );
} 