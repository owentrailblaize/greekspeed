'use client';

import type { ReactNode } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader />
      <main className="flex-1 min-h-0">{children}</main>
    </div>
  );
} 