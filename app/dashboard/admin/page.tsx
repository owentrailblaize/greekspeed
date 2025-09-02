'use client';
export const dynamic = "force-dynamic";

import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, UserCheck, Calculator, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PresidentDashboard } from "./executive/PresidentDashboard";
import { VicePresidentDashboard } from "./executive/VicePresidentDashboard";
import { TreasurerDashboard } from "./executive/TreasurerDashboard";
import { SocialChairDashboard } from "./executive/SocialChairDashboard";

const executiveRoles = [
  {
    value: "president",
    label: "President",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    component: PresidentDashboard,
    description: "Chapter leadership and oversight"
  },
  {
    value: "vice-president",
    label: "Vice President",
    icon: UserCheck,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    component: VicePresidentDashboard,
    description: "Operations and member coordination"
  },
  {
    value: "treasurer",
    label: "Treasurer",
    icon: Calculator,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    component: TreasurerDashboard,
    description: "Financial management and dues tracking"
  },
  {
    value: "social-chair",
    label: "Social Chair",
    icon: PartyPopper,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    component: SocialChairDashboard,
    description: "Events, budget, and social coordination"
  }
];

function ExecAdminPage() {
  const [selectedRole, setSelectedRole] = useState("president");
  
  const currentRole = executiveRoles.find(role => role.value === selectedRole);
  const CurrentComponent = currentRole?.component;
  const RoleIcon = currentRole?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Executive Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/60 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${currentRole?.color} rounded-xl flex items-center justify-center shadow-lg`}>
                {RoleIcon && <RoleIcon className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h1 className="text-navy-900 font-semibold">Executive Administration</h1>
                <p className="text-gray-600 text-sm">{currentRole?.description}</p>
              </div>
            </div>
            
            {/* Role Selector */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Role</p>
                <Badge className={`${currentRole?.bgColor} ${currentRole?.textColor} border-0`}>
                  {currentRole?.label}
                </Badge>
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="h-10 w-48 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-navy-500 focus:outline-none"
              >
                {executiveRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* First Div - Executive Administration Info with Current Role */}
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${currentRole?.color} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
                {RoleIcon && <RoleIcon className="h-5 w-5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-navy-900 font-semibold text-lg leading-tight">Executive Administration</h1>
                  <Badge className={`${currentRole?.bgColor} ${currentRole?.textColor} border-0 text-xs whitespace-nowrap flex-shrink-0`}>
                    {currentRole?.label}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm leading-tight break-words">{currentRole?.description}</p>
              </div>
            </div>
            
            {/* Second Div - Role Selector */}
            <div className="flex flex-col space-y-3">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
              >
                {executiveRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role-Specific Dashboard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedRole}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.02 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="relative"
        >
          {CurrentComponent && <CurrentComponent />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function AdminPage() {
  // Only allow admin
  const { hasAccess, loading } = useRoleAccess(['admin']);

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied. Admin access required.</div>;

  return (
    <div className="space-y-6">
      <ExecAdminPage />
    </div>
  );
}
