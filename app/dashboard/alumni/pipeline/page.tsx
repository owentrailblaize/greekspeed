'use client';
export const dynamic = "force-dynamic";

import { AlumniPipeline } from '@/components/features/alumni/AlumniPipeline';
import { ProfileCompletionGate } from '@/components/features/profile/ProfileCompletionGate';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export default function Page() {
  const { profile } = useProfile();
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
          console.error('Error loading alumni data:', error);
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
      console.error('Error checking profile completion:', error);
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
    <>
      <AlumniPipeline />
      
      {/* Profile Completion Gate Modal */}
      {showProfileCompletionGate && profile && (
        <ProfileCompletionGate
          isOpen={showProfileCompletionGate}
          onClose={handleProfileCompletionClose}
          profile={profile}
          requiredCompletionPercentage={80}
        />
      )}
    </>
  );
} 