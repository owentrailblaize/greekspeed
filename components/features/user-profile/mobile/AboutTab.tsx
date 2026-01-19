'use client';

import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  Building2, 
  GraduationCap,
  MapPin
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

export function AboutTab({ profile }: AboutTabProps) {
  const alumni = profile.alumni || {};
  const userData = profile.user || {};
  const isAlumni = profile.type === 'alumni';

  const isEmailPublic = isAlumni ? (alumni.isEmailPublic !== false && alumni.is_email_public !== false) : true;
  const isPhonePublic = isAlumni ? (alumni.isPhonePublic !== false && alumni.is_phone_public !== false) : true;

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-base flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-400" />
          Contact
        </h3>
        <div className="space-y-2 text-sm pl-6">
          <div>
            <span className="text-gray-500 block mb-1">Email</span>
            <span className="text-gray-900">
              {profile.email || (!isEmailPublic ? 'Hidden by user' : 'Not available')}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Phone</span>
            <span className="text-gray-900">
              {profile.phone || (!isPhonePublic ? 'Hidden by user' : 'Not available')}
            </span>
          </div>
          {profile.location && profile.location !== "Not Specified" && (
            <div>
              <span className="text-gray-500 block mb-1">Location</span>
              <span className="text-gray-900 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Professional / Academic Information */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-base flex items-center">
          {isAlumni ? (
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
          ) : (
            <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
          )}
          {isAlumni ? 'Professional' : 'Academic'}
        </h3>
        <div className="space-y-2 text-sm pl-6">
          {isAlumni ? (
            <>
              {alumni.industry && alumni.industry !== "Not Specified" && (
                <div>
                  <span className="text-gray-500 block mb-1">Industry</span>
                  <Badge variant="outline" className="text-xs">{alumni.industry}</Badge>
                </div>
              )}
              {alumni.graduationYear && (
                <div>
                  <span className="text-gray-500 block mb-1">Graduation Year</span>
                  <span className="text-gray-900">{alumni.graduationYear}</span>
                </div>
              )}
              {profile.chapter && (
                <div>
                  <span className="text-gray-500 block mb-1">Chapter</span>
                  <span className="text-gray-900">{getChapterName(profile.chapter_id)}</span>
                </div>
              )}
              {alumni.lastContact && (
                <div>
                  <span className="text-gray-500 block mb-1">Last Contact</span>
                  <span className="text-gray-900 text-xs">
                    {alumni.lastContact ? new Date(alumni.lastContact).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {userData.grad_year && (
                <div>
                  <span className="text-gray-500 block mb-1">Grad Year</span>
                  <span className="text-gray-900">{userData.grad_year}</span>
                </div>
              )}
              {userData.major && (
                <div>
                  <span className="text-gray-500 block mb-1">Major</span>
                  <span className="text-gray-900">{userData.major}</span>
                </div>
              )}
              {userData.minor && (
                <div>
                  <span className="text-gray-500 block mb-1">Minor</span>
                  <span className="text-gray-900">{userData.minor}</span>
                </div>
              )}
              {userData.role && (
                <div>
                  <span className="text-gray-500 block mb-1">Role</span>
                  <Badge variant="outline" className="text-xs">{userData.role}</Badge>
                </div>
              )}
              {profile.chapter && (
                <div>
                  <span className="text-gray-500 block mb-1">Chapter</span>
                  <span className="text-gray-900">{profile.chapter}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

