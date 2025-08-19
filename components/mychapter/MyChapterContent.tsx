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
}

export function MyChapterContent({ onNavigate }: MyChapterContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  
  // Get current user's profile and chapter
  const { profile, loading: profileLoading } = useProfile();
  
  // Fetch chapter members based on user's chapter
  const { members, loading: membersLoading, error } = useChapterMembers(profile?.chapter_id || undefined);
  
  // Role checking
  const { hasChapterRoleAccess } = useChapterRoleAccess(CHAPTER_ADMIN_ROLES);

  // Transform database data to match component expectations
  const transformedMembers: ChapterMember[] = members.map(member => ({
    id: member.id,
    name: member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown Member',
    year: member.grad_year ? member.grad_year.toString() : 'N/A',
    major: member.major || 'Undeclared',
    position: member.chapter_role ? getRoleDisplayName(member.chapter_role) : undefined, // Change null to undefined
    avatar: member.avatar_url || undefined,
    verified: member.role === 'admin',
    mutualConnections: [],
    mutualConnectionsCount: 0,
    description: member.bio || `${member.major || 'Undeclared'} • ${member.chapter_role || 'Member'}`
  }));

  // Filter members based on search and filters
  const filteredMembers = transformedMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.description && member.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesYear = !selectedYear || member.year.includes(selectedYear);
    const matchesMajor = !selectedMajor || member.major === selectedMajor;
    
    return matchesSearch && matchesYear && matchesMajor;
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

  if (profileLoading || membersLoading) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
      <div className="text-lg">Loading chapter members...</div>
    </div>;
  }

  if (error) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-red-600">Error loading members: {error}</div>
    </div>;
  }

  if (!profile?.chapter_id) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
      <div className="text-lg">You are not connected to any chapter.</div>
    </div>;
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">My Chapter</h1>
              {profile.chapter && (
                <span className="text-sm text-gray-500">({profile.chapter})</span>
              )}
            </div>
            
            {hasChapterRoleAccess && (
              <button 
                className="bg-navy-600 hover:bg-navy-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                onClick={() => onNavigate('add-member')}
              >
                Add Member
              </button>
            )}
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search members by name, major, or interests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-navy-500 focus:border-navy-500"
            >
              <option value="">All Majors</option>
              <option value="Business">Business</option>
              <option value="Engineering">Engineering</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Pre-Med">Pre-Med</option>
              <option value="Liberal Arts">Liberal Arts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
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
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
} 