
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, AlertCircle, Briefcase, Building2, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EditProfileModal } from '@/components/EditProfileModal';
import { useProfile } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client';

interface ProfileCompletionGateProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  requiredCompletionPercentage?: number;
}

interface AlumniData {
  industry: string | null;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  location: string | null;
}

export function ProfileCompletionGate({ 
  isOpen, 
  onClose, 
  profile, 
  requiredCompletionPercentage = 80 
}: ProfileCompletionGateProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completion, setCompletion] = useState<any>(null);
  const [alumniData, setAlumniData] = useState<AlumniData | null>(null);
  const { updateProfile } = useProfile();

  // Load completion data when modal opens
  useEffect(() => {
    if (isOpen && profile?.id) {
      loadCompletionData();
    }
  }, [isOpen, profile]);

  const loadCompletionData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Load alumni data if user is alumni
      let currentAlumniData = null;
      if (profile.role === 'alumni') {
        const { data: alumni, error } = await supabase
          .from('alumni')
          .select('industry, company, job_title, phone, location')
          .eq('user_id', profile.id)
          .single();

        if (error) {
          console.error('Error loading alumni data:', error);
        } else {
          currentAlumniData = alumni;
          setAlumniData(alumni);
        }
      }

      // Calculate completion
      const completionData = await calculateProfileCompletion(profile, currentAlumniData);
      setCompletion(completionData);
    } catch (error) {
      console.error('Error loading completion data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = async (profile: any, alumniData: AlumniData | null) => {
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
        const value = alumniData[field as keyof AlumniData];
        if (value && value.trim() !== '' && value !== 'Not specified') {
          completedFields++;
        } else {
          missingFields.push(field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
      });
    }

    const percentage = Math.round((completedFields / allFields.length) * 100);
    const isComplete = percentage >= requiredCompletionPercentage;

    return {
      totalFields: allFields.length,
      completedFields,
      percentage,
      missingFields,
      isComplete
    };
  };

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    try {
      await updateProfile(updatedProfile);
      // Refresh completion data after profile update
      await loadCompletionData();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getRoleSpecificMessage = () => {
    if (profile?.role === 'alumni') {
      return 'Complete your professional information to access the alumni pipeline.';
    }
    return 'Complete your profile information to access all features.';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg max-w-lg w-full my-8 shadow-2xl"
        >
          <div className="flex flex-col">
            <div className="pb-4 flex-shrink-0 px-6 pt-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                Profile Completion Required
              </CardTitle>
              <p className="text-center text-sm text-gray-600 mt-2">
                {getRoleSpecificMessage()}
              </p>
            </div>
            
            <div className="pt-0 px-6 pb-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-2 text-gray-600">Loading profile...</span>
                </div>
                ) : completion ? (
                  <>
                    {/* Profile Completion Status */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1 text-red-900">
                            Profile Incomplete - Access Restricted
                          </h4>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              {completion.percentage}% Complete
                            </Badge>
                            <span className="text-xs text-red-700">
                              Need {requiredCompletionPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Missing Fields List - Column Layout */}
                  {completion.missingFields.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-900 mb-3">
                        {profile?.role === 'alumni' ? 'Required Professional Information:' : 'Missing Information:'}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {completion.missingFields.slice(0, 8).map((field: string, index: number) => (
                          <motion.div
                            key={field}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center space-x-2 text-sm text-gray-600"
                          >
                            <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0"></div>
                            <span className="truncate">{field}</span>
                          </motion.div>
                        ))}
                      </div>
                      {completion.missingFields.length > 8 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          +{completion.missingFields.length - 8} more fields
                        </p>
                      )}
                    </div>
                  )}

                  {/* Benefits Section - Simplified */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-sm text-blue-900 mb-2">
                      {profile?.role === 'alumni' ? 'Why Complete Your Professional Profile?' : 'Why Complete Your Profile?'}
                    </h4>
                    <div className="space-y-2">
                      {profile?.role === 'alumni' ? (
                        <>
                          <div className="flex items-start space-x-2">
                            <Building2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                              Help other alumni find you by industry and company
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Briefcase className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                              Enable professional networking and career opportunities
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start space-x-2">
                            <User className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                              Improve your visibility in the chapter network
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-blue-800">
                              Enable direct communication with other members
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Unable to load profile completion data</p>
                </div>
              )}
            </div>

            {/* Fixed Footer with Action Button */}
            <div className="rounded-b-lg flex-shrink-0 border-t border-gray-200 px-6 py-3 bg-white">
              <Button
                onClick={handleEditProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-sm font-medium w-full"
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Complete Profile
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}