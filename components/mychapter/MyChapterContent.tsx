"use client";

import { useState, useEffect } from "react";
import { LinkedInStyleChapterCard } from "./LinkedInStyleChapterCard";
import { ChapterMember } from "@/types/chapter";
import { useChapterRoleAccess } from '@/lib/hooks/useChapterRoleAccess';
import { useChapterMembers } from '@/lib/hooks/useChapterMembers';
import { useProfile } from '@/lib/hooks/useProfile';
import { CHAPTER_ADMIN_ROLES } from '@/lib/permissions';

interface MyChapterContentProps {
  onNavigate: (section: string) => void;
  activeSection: string; // Add this prop
}

export function MyChapterContent({ onNavigate, activeSection }: MyChapterContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get current user's profile and chapter
  const { profile, loading: profileLoading } = useProfile();
  
  // Fetch chapter members based on user's chapter, excluding alumni
  const { members, loading: membersLoading, error } = useChapterMembers(profile?.chapter_id || undefined, true);
  
  // Role checking
  const { hasChapterRoleAccess } = useChapterRoleAccess(CHAPTER_ADMIN_ROLES);

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
      position: member.chapter_role && member.chapter_role !== 'member' ? getRoleDisplayName(member.chapter_role) : undefined,
      avatar: member.avatar_url || undefined,
      verified: member.role === 'admin',
      mutualConnections: [],
      mutualConnectionsCount: 0,
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
  const officers = filteredMembers.filter(member => 
    member.position && ['President', 'Vice President', 'Treasurer', 'Secretary', 'Rush Chair', 'Social Chair'].includes(member.position)
  );
  const generalMembers = filteredMembers.filter(member => 
    !member.position || member.position === 'Member' || member.position === 'Pledge'
  );

  // Helper function to get role display name
  function getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'president': 'President',
      'vice_president': 'Vice President',
      'treasurer': 'Treasurer',
      'secretary': 'Secretary',
      'rush_chair': 'Rush Chair',
      'social_chair': 'Social Chair',
      'philanthropy_chair': 'Philanthropy Chair',
      'risk_management_chair': 'Risk Management Chair',
      'alumni_relations_chair': 'Alumni Relations Chair',
      'member': 'Member',
      'pledge': 'Pledge'
    };
    return roleNames[role] || 'Member';
  }

  // Filter members based on active section
  const getFilteredMembers = () => {
    switch (activeSection) {
      case "all":
        return filteredMembers; // Show all members (original view)
      case "members":
        return generalMembers; // Show only general members
      case "officers":
        return officers; // Show only officers
      case "events":
      case "alumni":
      case "resources":
        return []; // Show empty state for unimplemented sections
      default:
        return filteredMembers; // Default to all members
    }
  };

  const displayMembers = getFilteredMembers();

  // Show original view for "all" section
  if (activeSection === "all") {
    return (
      <div className="flex-1 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">My Chapter</h1>
                {profile?.chapter && (
                  <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">({profile.chapter})</span>
                )}
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search members by name, major, or interests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500 text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm"
                />
                <svg className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Original Layout */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Officers Section */}
          {officers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <h2 className="text-lg font-medium text-gray-900">Officers & Leadership</h2>
                <span className="text-sm text-gray-500">({officers.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                {officers.map((member) => (
                  <LinkedInStyleChapterCard 
                    key={member.id} 
                    member={member}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                {generalMembers.map((member) => (
                  <LinkedInStyleChapterCard 
                    key={member.id} 
                    member={member}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show filtered view for other sections
  return (
    <div className="flex-1 bg-gray-50">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {activeSection === "members" && "General Members"}
                {activeSection === "officers" && "Officers & Leadership"}
                {activeSection === "events" && "Events & Activities"}
                {activeSection === "alumni" && "Alumni Network"}
                {activeSection === "resources" && "Chapter Resources"}
                {activeSection === "settings" && "Chapter Settings"}
              </h1>
              {profile?.chapter && (
                <span className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">({profile.chapter})</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {displayMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
            {displayMembers.map((member) => (
              <LinkedInStyleChapterCard 
                key={member.id} 
                member={member}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500">
              {activeSection === "events" && "Events functionality coming soon."}
              {activeSection === "alumni" && "Alumni network functionality coming soon."}
              {activeSection === "resources" && "Resources functionality coming soon."}
              {activeSection === "settings" && "Settings functionality coming soon."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 