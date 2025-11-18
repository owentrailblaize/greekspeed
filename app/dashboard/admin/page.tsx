'use client';
export const dynamic = "force-dynamic";

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useState } from "react";
import { UnifiedExecutiveDashboard } from "@/components/features/dashboard/dashboards/UnifiedExecutiveDashboard";

function ExecAdminPage() {
  const [selectedRole, setSelectedRole] = useState("president");

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedExecutiveDashboard 
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
      />
    </div>
  );
}

export default function AdminPage() {
  // Only allow admin
  const { hasAccess, loading } = useRoleAccess(['admin']);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. Admin access required.</div>;

  return (
    <div className="h-screen overflow-hidden">
      <ExecAdminPage />
    </div>
  );
}
