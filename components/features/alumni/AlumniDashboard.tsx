"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlumniPipeline } from "./AlumniPipeline";
import { ActivelyHiringPage } from "./ActivelyHiringPage";
import { MyChapterPage } from "@/components/mychapter/MyChapterPage";
import { ProfileCompletionGate } from "@/components/features/profile/ProfileCompletionGate";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

const pageTransition = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 1.02 },
};

export function AlumniDashboard() {
  const { profile } = useProfile();
  const [active, setActive] = useState("pipeline");
  const [isMobileHeaderCollapsed, setIsMobileHeaderCollapsed] = useState(false);
  const [showProfileCompletionGate, setShowProfileCompletionGate] = useState(false);
  const [profileCompletionChecked, setProfileCompletionChecked] = useState(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0);
  const [userManuallyClosed, setUserManuallyClosed] = useState(false);

  // Check profile completion when component mounts and profile loads
  useEffect(() => {
    if (profile && !profileCompletionChecked && !userManuallyClosed) {
      checkProfileCompletion();
    }
  }, [profile, profileCompletionChecked, userManuallyClosed]);

  const checkProfileCompletion = async () => {
    if (!profile?.id) return;

    try {
      // Load alumni data if user is alumni
      let alumniData = null;
      if (profile.role === 'alumni') {
        const { data: alumni, error } = await supabase
          .from('alumni')
          .select('industry, company, job_title, phone, location')
          .eq('user_id', profile.id)
          .single();

        if (error) {
          logger.error('Error loading alumni data:', { context: [error] });
        } else {
          alumniData = alumni;
        }
      }

      // Calculate completion
      const completion = await calculateProfileCompletion(profile, alumniData);
      
      // Store the completion percentage
      setProfileCompletionPercentage(completion.percentage);
      
      // Always show gate if completion is less than 80%
      if (completion.percentage < 80) {
        setShowProfileCompletionGate(true);
      }

      setProfileCompletionChecked(true);
    } catch (error) {
      logger.error('Error checking profile completion:', { context: [error] });
    }
  };

  const calculateProfileCompletion = async (profile: any, alumniData: any) => {
    const requiredFields = ['first_name', 'last_name', 'chapter', 'role'];
    const optionalFields = ['bio', 'phone', 'location', 'avatar_url'];
    const alumniRequiredFields = ['industry', 'company', 'job_title'];
    
    let allFields = [...requiredFields, ...optionalFields];
    let completedFields = 0;
    const missingFields: string[] = [];

    // Check regular profile fields
    requiredFields.forEach(field => {
      const value = profile[field];
      if (value && value.trim() !== '') {
        completedFields++;
      } else {
        missingFields.push(field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });

    optionalFields.forEach(field => {
      const value = profile[field];
      if (value && value.trim() !== '' && value !== 'Not specified') {
        completedFields++;
      } else {
        missingFields.push(field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });

    // For alumni users, check alumni-specific fields
    if (profile.role === 'alumni' && alumniData) {
      allFields = [...allFields, ...alumniRequiredFields];
      
      alumniRequiredFields.forEach(field => {
        const value = alumniData[field];
        if (value && value.trim() !== '' && value !== 'Not specified') {
          completedFields++;
        } else {
          missingFields.push(field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
      });
    }

    const percentage = Math.round((completedFields / allFields.length) * 100);
    const isComplete = percentage >= 80;

    return {
      totalFields: allFields.length,
      completedFields,
      percentage,
      missingFields,
      isComplete
    };
  };
  
  // Function to get the correct label based on user role
  const getChapterLabel = () => {
    return profile?.role === 'alumni' ? "Active Members" : "My Chapter";
  };
  
  const tabs = [
    { id: "pipeline", label: "Alumni Pipeline", component: AlumniPipeline },
    { id: "chapter", label: getChapterLabel(), component: MyChapterPage },
    { 
      id: "hiring", 
      label: "Actively Hiring", 
      component: ActivelyHiringPage,
      disabled: true
    }
  ];

  const handleTabClick = (tabId: string, disabled: boolean = false) => {
    if (disabled) {
      // Actively Hiring - Feature coming soon!
      return;
    }
    setActive(tabId);
  };

  const toggleMobileHeader = () => {
    setIsMobileHeaderCollapsed(!isMobileHeaderCollapsed);
  };

  const handleProfileCompletionClose = () => {
    setShowProfileCompletionGate(false);
    setUserManuallyClosed(true);
    // Don't reset profileCompletionChecked - let it stay checked until next page visit
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    // After profile update, recheck completion
    setProfileCompletionChecked(false);
    setShowProfileCompletionGate(false);
    setUserManuallyClosed(false); // Reset manual close flag so modal can show again if needed
    // The useEffect will trigger checkProfileCompletion again
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Mobile Header with Collapse Functionality */}
      <div className="sm:hidden bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          {/* Collapsible Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {/* Mobile: Show full text for pipeline, shortened for others */}
                <span className="sm:hidden">
                  {active === "pipeline" && "Alumni Pipeline"}
                  {active === "chapter" && (profile?.role === 'alumni' ? "Members" : "Chapter")}
                  {active === "hiring" && "Hiring"}
                </span>
                <span className="hidden sm:inline">
                  {tabs.find(t => t.id === active)?.label}
                </span>
              </span>
              {tabs.find(t => t.id === active)?.disabled && (
                <Lock className="h-3 w-3 text-gray-400" />
              )}
            </div>
            <button
              onClick={toggleMobileHeader}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileHeaderCollapsed ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Collapsible Tabs */}
          <AnimatePresence>
            {!isMobileHeaderCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex space-x-2 pt-3">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTabClick(t.id, t.disabled)}
                      disabled={t.disabled}
                      className={`text-sm font-medium px-3 py-2 rounded-md transition-colors flex items-center ${
                        t.disabled 
                          ? "opacity-60 cursor-not-allowed text-gray-400 bg-gray-50" 
                          : active === t.id 
                            ? "bg-navy-600 text-white" 
                            : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {/* Mobile: Short text, Desktop: Full text */}
                      <span className="sm:hidden">
                        {t.id === "pipeline" && "Pipeline"}
                        {t.id === "chapter" && (profile?.role === 'alumni' ? "Members" : "Chapter")}
                        {t.id === "hiring" && "Hiring"}
                      </span>
                      <span className="hidden sm:inline">{t.label}</span>
                      {t.disabled && (
                        <Lock className="h-3 w-3 ml-1 text-gray-400" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Tabs - Preserved Layout */}
      <div className="hidden sm:block bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex space-x-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id, t.disabled)}
              disabled={t.disabled}
              className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                t.disabled 
                  ? "opacity-60 cursor-not-allowed text-gray-400 bg-gray-50" 
                  : active === t.id 
                    ? "bg-navy-600 text-white" 
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.label}
              {t.disabled && (
                <Lock className="h-3 w-3 ml-2 text-gray-400 inline" />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {tabs.map(
            (t) =>
              t.id === active && (
                <motion.div key={t.id} variants={pageTransition} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                  <t.component />
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>

      {/* Profile Completion Gate Modal */}
      {showProfileCompletionGate && profile && (
        <ProfileCompletionGate
          isOpen={showProfileCompletionGate}
          onClose={handleProfileCompletionClose}
          profile={profile}
          requiredCompletionPercentage={80}
        />
      )}
    </div>
  );
} 