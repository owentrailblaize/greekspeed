'use client';
export const dynamic = "force-dynamic";

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

export function ExecAdminPage() {
  const [selectedRole, setSelectedRole] = useState("president");
  
  const currentRole = executiveRoles.find(role => role.value === selectedRole);
  const CurrentComponent = currentRole?.component;
  const RoleIcon = currentRole?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Executive Header */}
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200/60 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
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

export default ExecAdminPage;