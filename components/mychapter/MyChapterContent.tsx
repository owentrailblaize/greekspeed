"use client";

import { useState } from "react";
import { LinkedInStyleChapterCard } from "./LinkedInStyleChapterCard";
import { ChapterMember } from "./types";

interface MyChapterContentProps {
  members: ChapterMember[];
  onNavigate: (section: string) => void;
}

export function MyChapterContent({ members, onNavigate }: MyChapterContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  const officers = members.filter(member => member.position);
  const generalMembers = members.filter(member => !member.position);

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.interests.some(interest => 
                           interest.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesYear = !selectedYear || member.year === selectedYear;
    const matchesMajor = !selectedMajor || member.major === selectedMajor;
    
    return matchesSearch && matchesYear && matchesMajor;
  });

  const filteredOfficers = filteredMembers.filter(member => member.position);
  const filteredGeneralMembers = filteredMembers.filter(member => !member.position);

  const handleMessage = (memberId: string) => {
    console.log(`Message member: ${memberId}`);
    // TODO: Implement messaging functionality
  };

  const handleConnect = (memberId: string) => {
    console.log(`Connect with member: ${memberId}`);
    // TODO: Implement connection functionality
  };

  // Mock connection status - in real app this would come from your backend
  const getConnectionStatus = (memberId: string) => {
    // For demo purposes, let's say officers are connected and some general members are
    const connectedMembers = ['1', '2', '3', '7']; // Jake, Sofia, Marcus, Connor
    return connectedMembers.includes(memberId);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">My Chapter</h1>
            </div>
            <button 
              className="bg-navy-600 hover:bg-navy-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={() => onNavigate('add-member')}
            >
              Add Member
            </button>
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
              <option value="Freshman">Freshman</option>
              <option value="Sophomore">Sophomore</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
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
        {filteredOfficers.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-lg font-medium text-gray-900">Officers & Leadership</h2>
              <span className="text-sm text-gray-500">({filteredOfficers.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {filteredOfficers.map((member) => (
                <LinkedInStyleChapterCard 
                  key={member.id} 
                  member={member}
                  onMessage={handleMessage}
                  onConnect={handleConnect}
                  isConnected={getConnectionStatus(member.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* General Members Section */}
        {filteredGeneralMembers.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-lg font-medium text-gray-900">General Members</h2>
              <span className="text-sm text-gray-500">({filteredGeneralMembers.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {filteredGeneralMembers.map((member) => (
                <LinkedInStyleChapterCard 
                  key={member.id} 
                  member={member}
                  onMessage={handleMessage}
                  onConnect={handleConnect}
                  isConnected={getConnectionStatus(member.id)}
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