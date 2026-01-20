'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  Briefcase,
  Calendar,
  User,
  Lock,
  Users,
  ExternalLink
} from "lucide-react";
import { UnifiedUserProfile } from "@/types/user-profile";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AboutTabProps {
  profile: UnifiedUserProfile;
  isLoggedIn?: boolean;
  canSeeFullProfile?: boolean;
}

const getChapterName = (chapterId: string | null | undefined): string => {
  if (!chapterId) return '';
  
  const chapterMap: Record<string, string> = {
    "404e65ab-1123-44a0-81c7-e8e75118e741": "Sigma Chi Eta (Ole Miss)",
    "8ede10e8-b848-427d-8f4a-aacf74cea2c2": "Phi Gamma Delta Omega Chi (Chapman)",
    "b25a4acf-59f0-46d4-bb5c-d41fda5b3252": "Phi Delta Theta Mississippi Alpha (Ole Miss)",
    "ff740e3f-c45c-4728-a5d5-22088c19d847": "Kappa Sigma Delta-Xi (Ole Miss)"
  };
  
  return chapterMap[chapterId] || chapterId;
};

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 sm:mb-0">
        {label}
      </span>
      <div className="text-base font-medium text-gray-900 break-words sm:text-right">
        {value}
      </div>
    </div>
  );
}

export function AboutTab({ profile, isLoggedIn = false, canSeeFullProfile = false }: AboutTabProps) {
  const alumni = profile.alumni || {};
  const userData = profile.user || {};
  const isAlumni = profile.type === 'alumni';

  const isEmailPublic = isAlumni ? (alumni.isEmailPublic !== false && alumni.is_email_public !== false) : true;
  const isPhonePublic = isAlumni ? (alumni.isPhonePublic !== false && alumni.is_phone_public !== false) : true;

  // Determine if sensitive info should be shown
  const showEmail = isLoggedIn && (canSeeFullProfile || isEmailPublic);
  const showPhone = isLoggedIn && (canSeeFullProfile || isPhonePublic);
  const showPrivateInfo = isLoggedIn && canSeeFullProfile;

  return (
    <div className="w-full px-8 md:px-16 py-8 max-w-7xl mx-auto">
      {/* Full-width, cardless layout */}
      <div className="space-y-8">
          {/* Chapter Section - Always visible */}
          {profile.chapter && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                  Chapter
                </h3>
              </div>
              <p className="text-base text-gray-900 ml-7">
                {getChapterName(profile.chapter_id) || profile.chapter}
              </p>
            </div>
          )}

          {/* General Information Section - Always visible */}
          {(profile.location || profile.bio || userData?.linkedin_url) && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                  General Information
                </h3>
              </div>
              <div className="space-y-4 ml-7">
                {profile.location && (
                  <InfoRow
                    label="Location"
                    value={profile.location}
                  />
                )}
                {profile.bio && (
                  <InfoRow
                    label="About"
                    value={<span className="text-base text-gray-700 whitespace-pre-wrap break-words">{profile.bio}</span>}
                  />
                )}
                {userData?.linkedin_url && (
                  <InfoRow
                    label="LinkedIn"
                    value={
                      <a 
                        href={userData.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
                      >
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Membership Section - Always visible for active members */}
          {!isAlumni && (userData.chapter_role || userData.member_status || userData.pledge_class) && (
            <div className="pb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                  Membership
                </h3>
              </div>
              <div className="space-y-4 ml-7">
                {userData.chapter_role && (
                  <InfoRow
                    label="Chapter Role"
                    value={<Badge variant="outline" className="text-xs capitalize">{userData.chapter_role.replace(/_/g, ' ')}</Badge>}
                  />
                )}
                {userData.member_status && (
                  <InfoRow
                    label="Member Status"
                    value={<Badge variant="outline" className="text-xs capitalize">{userData.member_status}</Badge>}
                  />
                )}
                {userData.pledge_class && (
                  <InfoRow
                    label="Pledge Class"
                    value={userData.pledge_class}
                  />
                )}
              </div>
            </div>
          )}

          {/* Contact Section - Locked for non-logged-in */}
          <div className="relative pb-6 border-b border-gray-200">
            {!isLoggedIn && (
              <div className="absolute top-0 right-0 flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 z-10">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Sign in required</span>
              </div>
            )}
            <div className={cn(!isLoggedIn && "opacity-60")}>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                  Contact
                </h3>
              </div>
              <div className="space-y-4 ml-7">
                <InfoRow
                  label="Email"
                  value={
                    showEmail 
                      ? (profile.email || 'Not available')
                      : (!isLoggedIn ? 'Sign in to view' : (!isEmailPublic ? 'Hidden by user' : 'Not available'))
                  }
                />
                <InfoRow
                  label="Phone"
                  value={
                    showPhone 
                      ? (profile.phone || 'Not available')
                      : (!isLoggedIn ? 'Sign in to view' : (!isPhonePublic ? 'Hidden by user' : 'Not available'))
                  }
                />
              </div>
            </div>
          </div>

          {/* Academic Section - Show locked version for non-logged-in */}
          {!isAlumni && (
            <div className="relative pb-6 border-b border-gray-200">
              {!isLoggedIn && (
                <div className="absolute top-0 right-0 flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 z-10">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Sign in required</span>
                </div>
              )}
              <div className={cn(!isLoggedIn && "opacity-60")}>
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                    Academic
                  </h3>
                </div>
                <div className="space-y-4 ml-7">
                  {showPrivateInfo ? (
                    <>
                      {userData.grad_year && (
                        <InfoRow
                          label="Grad Year"
                          value={userData.grad_year.toString()}
                        />
                      )}
                      {userData.major && (
                        <InfoRow
                          label="Major"
                          value={userData.major}
                        />
                      )}
                      {userData.minor && (
                        <InfoRow
                          label="Minor"
                          value={userData.minor}
                        />
                      )}
                      {userData.role && (
                        <InfoRow
                          label="Role"
                          value={<Badge variant="outline" className="text-xs">{userData.role}</Badge>}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <InfoRow label="Grad Year" value="Sign in to view" />
                      <InfoRow label="Major" value="Sign in to view" />
                      <InfoRow label="Minor" value="Sign in to view" />
                      {userData.role && (
                        <InfoRow label="Role" value="Sign in to view" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Professional Section - Show locked version for non-logged-in */}
          {isAlumni && (
            <div className="relative pb-6 border-b border-gray-200">
              {!isLoggedIn && (
                <div className="absolute top-0 right-0 flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 z-10">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Sign in required</span>
                </div>
              )}
              <div className={cn(!isLoggedIn && "opacity-60")}>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide">
                    Professional
                  </h3>
                </div>
                <div className="space-y-4 ml-7">
                  {showPrivateInfo ? (
                    <>
                      {alumni.industry && alumni.industry !== "Not Specified" && (
                        <InfoRow
                          label="Industry"
                          value={<Badge variant="outline" className="text-xs">{alumni.industry}</Badge>}
                        />
                      )}
                      {alumni.graduationYear && (
                        <InfoRow
                          label="Graduation Year"
                          value={alumni.graduationYear.toString()}
                        />
                      )}
                      {alumni.company && alumni.company !== "Not Specified" && (
                        <InfoRow
                          label="Company"
                          value={alumni.company}
                        />
                      )}
                      {alumni.jobTitle && alumni.jobTitle !== "Not Specified" && (
                        <InfoRow
                          label="Job Title"
                          value={alumni.jobTitle}
                        />
                      )}
                      {alumni.isActivelyHiring && (
                        <InfoRow
                          label="Status"
                          value={
                            <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white text-xs">
                              Actively Hiring
                            </Badge>
                          }
                        />
                      )}
                      {alumni.description && (
                        <InfoRow
                          label="Description"
                          value={<span className="text-sm text-gray-700 whitespace-pre-wrap break-words">{alumni.description}</span>}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <InfoRow label="Industry" value="Sign in to view" />
                      <InfoRow label="Graduation Year" value="Sign in to view" />
                      <InfoRow label="Company" value="Sign in to view" />
                      <InfoRow label="Job Title" value="Sign in to view" />
                      {alumni.isActivelyHiring && (
                        <InfoRow label="Status" value="Sign in to view" />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

