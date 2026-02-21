'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ConnectionManagement } from '@/components/ui/ConnectionManagement';

export default function NotificationsConnectionsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/dashboard/notifications')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Connection Management</h1>
        </div>
      </div>

      {/* Connection Management Component - Full width, no padding, no borders */}
      <ConnectionManagement 
        variant="mobile" 
        hideCard
        className="w-full" 
      />
    </div>
  );
}
