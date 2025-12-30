"use client";

import { useState } from "react";
import { LinkedInStyleChapterCard } from "./LinkedInStyleChapterCard";
import { ChapterCardSkeletonGrid } from "./ChapterCardSkeleton";
import { ChapterMember } from "@/types/chapter";
import { useChapterRoleAccess } from '@/lib/hooks/useChapterRoleAccess';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { CHAPTER_ADMIN_ROLES, getRoleDisplayName } from '@/lib/permissions';
import { Loader2 } from "lucide-react";
import { ViewUserModal } from "@/components/user-management/ViewUserModal";
import { ChapterMemberData } from "@/types/chapter";

interface MyChapterContentProps {
  onNavigate: (section: string) => void;
  activeSection: string;
  searchTerm: string; // Add this prop
}

export function MyChapterContent({ onNavigate, activeSection, searchTerm }: MyChapterContentProps) {
  
  // Get current user's profile and chapter
  const { profile, loading: profileLoading } = useProfile();
  
  // Fetch chapter members based on user's chapter, excluding alumni
  const { members, loading: membersLoading, error } = useChapterMembers(profile?.chapter_id || undefined, true);
  
  // Role checking
  const { hasChapterRoleAccess } = useChapterRoleAccess(CHAPTER_ADMIN_ROLES);

  // Modal state for viewing user profile
  const [selectedUser, setSelectedUser] = useState<ChapterMemberData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show loading state while profile or members are loading
  const isLoading = profileLoading || membersLoading;

  // Handle card click to open user modal
  const handleCardClick = (memberId: string) => {
    const memberData = members.find(m => m.id === memberId);
    if (memberData) {
      setSelectedUser(memberData);
      setIsModalOpen(true);
    }
  };

  // Convert ChapterMemberData to User type for ViewUserModal
  const convertToUser = (member: ChapterMemberData) => {
    return {
      id: member.id,
      email: member.email || '',
      full_name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown',
      first_name: member.first_name,
      last_name: member.last_name,
      chapter: member.chapter || null,
      role: member.role || null,
      created_at: member.created_at || new Date().toISOString(),
      updated_at: member.updated_at || new Date().toISOString(),
      bio: member.bio || null,
      phone: member.phone || null,
      location: member.location || null,
      avatar_url: member.avatar_url || null,
      chapter_role: member.chapter_role || null,
      member_status: member.member_status || null,
      pledge_class: member.pledge_class || null,
      grad_year: member.grad_year || null,
      major: member.major || null,
      minor: member.minor || null,
      hometown: member.hometown || null,
      gpa: member.gpa || null,
      chapter_id: member.chapter_id || null,
      is_developer: false, // Not available in ChapterMemberData
      developer_permissions: [], // Not available in ChapterMemberData
      access_level: null // Not available in ChapterMemberData
    };
  };

  // Update the transformation logic to handle null values better
  const transformedMembers: ChapterMember[] = members.map(member => {
    // Only use bio for description, nothing else
    const memberDescription = member.bio && member.bio !== 'null' && member.bio.trim() !== '' 
      ? member.bio 
      : 'Chapter Member';

    return {
      id: member.id,
      name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown Member',
      year: member.grad_year ? member.grad_year.toString() : undefined,
      major: member.major && member.major !== 'null' ? member.major : undefined,
      position: member.chapter_role && member.chapter_role !== 'member' 
        ? getRoleDisplayName(member.chapter_role as any) 
        : undefined,
      avatar: member.avatar_url || undefined,
      verified: member.role === 'admin',
      mutualConnections: (member as any).mutualConnections || [], // ✅ Use from API
      mutualConnectionsCount: (member as any).mutualConnectionsCount || 0, // ✅ Use from API
      description: memberDescription
    };
  });

  // Filter members based on search and filters
  const filteredMembers = transformedMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.major?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.description && member.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Separate officers from general members
  const leadershipTitles = ['President', 'Vice President', 'Treasurer', 'Secretary', 'Rush Chair', 'Social Chair'];
  const officers = filteredMembers.filter(member =>
    member.verified /* role === 'admin' */ ||
    (member.position && leadershipTitles.includes(member.position))
  );

  // Sort officers by leadership hierarchy
  const sortedOfficers = officers.sort((a, b) => {
    // Define the priority order for leadership positions
    const positionPriority: Record<string, number> = {
      'President': 1,
      'Vice President': 2,
      'Treasurer': 3,
      'Social Chair': 4,
      'Secretary': 5,
      'Rush Chair': 6,
      // Any other positions will be sorted alphabetically after the priority positions
    };

    const aPriority = positionPriority[a.position || ''] || 999;
    const bPriority = positionPriority[b.position || ''] || 999;

    // If priorities are different, sort by priority
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // If same priority or both are non-priority positions, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  const generalMembers = filteredMembers.filter(member => 
    !(member.verified || (member.position && leadershipTitles.includes(member.position)))
  );

  // Filter members based on active section
  const getFilteredMembers = () => {
    switch (activeSection) {
      case "all":
        return filteredMembers; // Show all members (original view)
      case "members":
        return generalMembers; // Show only general members
      case "officers":
        return sortedOfficers; // Show only sorted officers
      default:
        return filteredMembers; // Default to all members
    }
  };

  const displayMembers = getFilteredMembers();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6">
          <ChapterCardSkeletonGrid count={8} />
        </div>
      </div>
    );
  }

  // Show original view for "all" section
  if (activeSection === "all") {
    return (
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6">
          {/* Officers Section */}
          {sortedOfficers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-lg font-medium text-gray-900">Officers & Leadership</h2>
                <span className="text-sm text-gray-500">({sortedOfficers.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
                {sortedOfficers.map((member) => (
                  <LinkedInStyleChapterCard 
                    key={member.id} 
                    member={member}
                    onClick={() => handleCardClick(member.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* General Members Section */}
          {generalMembers.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-lg font-medium text-gray-900">General Members</h2>
                <span className="text-sm text-gray-500">({generalMembers.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
                {generalMembers.map((member) => (
                  <LinkedInStyleChapterCard 
                    key={member.id} 
                    member={member}
                    onClick={() => handleCardClick(member.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {filteredMembers.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}

          {/* User Profile Modal */}
          {selectedUser && (
            <ViewUserModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedUser(null);
              }}
              user={convertToUser(selectedUser)}
            />
          )}
        </div>
      </div>
    );
  }

  // Show filtered view for other sections
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-6">
        {displayMembers.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
            {displayMembers.map((member) => (
              <LinkedInStyleChapterCard 
                key={member.id} 
                member={member}
                onClick={() => handleCardClick(member.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500"></p>
          </div>
        )}
      </div>
      {/* User Profile Modal */}
      {selectedUser && (
        <ViewUserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
          user={convertToUser(selectedUser)}
        />
      )}
    </div>
  );
} 