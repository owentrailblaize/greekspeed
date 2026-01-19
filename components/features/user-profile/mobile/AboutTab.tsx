'use client';

import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  Briefcase,
  Calendar,
  User
} from "lucide-react";
import { UnifiedUserProfile } from "@/types/user-profile";

interface AboutTabProps {
  profile: UnifiedUserProfile;
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 sm:mb-0">
        {label}
      </span>
      <div className="text-sm font-medium text-gray-900 break-words text-right sm:text-left">
        {value}
      </div>
    </div>
  );
}

export function AboutTab({ profile }: AboutTabProps) {
  const alumni = profile.alumni || {};
  const userData = profile.user || {};
  const isAlumni = profile.type === 'alumni';

  const isEmailPublic = isAlumni ? (alumni.isEmailPublic !== false && alumni.is_email_public !== false) : true;
  const isPhonePublic = isAlumni ? (alumni.isPhonePublic !== false && alumni.is_phone_public !== false) : true;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Single Card Layout */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Chapter Section */}
          {profile.chapter && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Chapter
                </h3>
              </div>
              <p className="text-sm text-gray-900 ml-6">
                {getChapterName(profile.chapter_id) || profile.chapter}
              </p>
            </div>
          )}

          {/* Contact Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Contact
              </h3>
            </div>
            <div className="space-y-0 ml-6">
              <InfoRow
                label="Email"
                value={profile.email || (!isEmailPublic ? 'Hidden by user' : 'Not available')}
              />
              <InfoRow
                label="Phone"
                value={profile.phone || (!isPhonePublic ? 'Hidden by user' : 'Not available')}
              />
            </div>
          </div>

          {/* Academic Section - For Regular Users */}
          {!isAlumni && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Academic
                </h3>
              </div>
              <div className="space-y-0 ml-6">
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
              </div>
            </div>
          )}

          {/* Professional Section - For Alumni */}
          {isAlumni && (
            <>
              {/* Divider */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Professional Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    Professional
                  </h3>
                </div>
                <div className="space-y-0 ml-6">
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
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

