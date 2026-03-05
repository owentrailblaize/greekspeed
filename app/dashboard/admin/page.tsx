'use client';
export const dynamic = "force-dynamic";

import { Suspense } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useState } from "react";
import { UnifiedExecutiveDashboard } from "@/components/features/dashboard/dashboards/UnifiedExecutiveDashboard";

function ExecAdminPage() {
  const [selectedRole, setSelectedRole] = useState("president");

  return (
    <UnifiedExecutiveDashboard 
      selectedRole={selectedRole}
      onRoleChange={setSelectedRole}
    />
  );
}

export default function AdminPage() {
  // Only allow admin
  const { hasAccess, loading } = useRoleAccess(['admin']);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. Admin access required.</div>;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="h-[calc(100vh-80px)] overflow-hidden">
        <ExecAdminPage />
      </div>
    </Suspense>
  );
}
