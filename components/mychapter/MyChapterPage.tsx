"use client";

import { useState } from "react";
import { MyChapterSidebar } from "./MyChapterSidebar";
import { MyChapterContent } from "./MyChapterContent";
import { ChapterMember } from "@/types/chapter";

// Mock data for current chapter members with LinkedIn-style fields
const chapterMembers: ChapterMember[] = [
  {
    id: "1",
    name: "Jake Williams",
    year: "Senior",
    major: "Computer Science",
    position: "President",
    interests: ["Leadership", "Tech", "Networking"],
    verified: true,
    mutualConnections: [
      { name: "Sofia Rodriguez", avatar: undefined },
      { name: "Marcus Johnson", avatar: undefined },
      { name: "Lily Chen", avatar: undefined }
    ],
    mutualConnectionsCount: 8,
    description: "Chapter President • Computer Science Senior"
  },
  {
    id: "2",
    name: "Sofia Rodriguez",
    year: "Junior",
    major: "Business Administration",
    position: "Vice President",
    interests: ["Business Strategy", "Marketing", "Finance"],
    verified: true,
    mutualConnections: [
      { name: "Jake Williams", avatar: undefined },
      { name: "Ethan Davis", avatar: undefined },
      { name: "Maya Patel", avatar: undefined }
    ],
    mutualConnectionsCount: 6,
    description: "Vice President • Business Administration Junior"
  },
  {
    id: "3",
    name: "Marcus Johnson",
    year: "Sophomore",
    major: "Mechanical Engineering",
    position: "Treasurer",
    interests: ["Engineering", "Innovation", "Sports"],
    verified: false,
    mutualConnections: [
      { name: "Jake Williams", avatar: undefined },
      { name: "Connor Murphy", avatar: undefined }
    ],
    mutualConnectionsCount: 4,
    description: "Treasurer • Mechanical Engineering Sophomore"
  },
  {
    id: "4",
    name: "Lily Chen",
    year: "Senior",
    major: "Psychology",
    interests: ["Research", "Mental Health", "Community Service"],
    verified: true,
    mutualConnections: [
      { name: "Jake Williams", avatar: undefined },
      { name: "Zoe Thompson", avatar: undefined }
    ],
    mutualConnectionsCount: 5,
    description: "Psychology Senior • Research Focus"
  },
  {
    id: "5",
    name: "Ethan Davis",
    year: "Junior",
    major: "Economics",
    interests: ["Finance", "Investment", "Analytics"],
    verified: false,
    mutualConnections: [
      { name: "Sofia Rodriguez", avatar: undefined },
      { name: "Maya Patel", avatar: undefined }
    ],
    mutualConnectionsCount: 3,
    description: "Economics Junior • Finance Focus"
  },
  {
    id: "6",
    name: "Maya Patel",
    year: "Sophomore",
    major: "Pre-Med",
    interests: ["Healthcare", "Research", "Volunteering"],
    verified: false,
    mutualConnections: [
      { name: "Sofia Rodriguez", avatar: undefined },
      { name: "Ethan Davis", avatar: undefined }
    ],
    mutualConnectionsCount: 3,
    description: "Pre-Med Sophomore • Healthcare Focus"
  },
  {
    id: "7",
    name: "Connor Murphy",
    year: "Senior",
    major: "Marketing",
    position: "Social Chair",
    interests: ["Creative Design", "Social Media", "Events"],
    verified: true,
    mutualConnections: [
      { name: "Marcus Johnson", avatar: undefined },
      { name: "Zoe Thompson", avatar: undefined }
    ],
    mutualConnectionsCount: 4,
    description: "Social Chair • Marketing Senior"
  },
  {
    id: "8",
    name: "Zoe Thompson",
    year: "Junior",
    major: "Environmental Science",
    interests: ["Sustainability", "Research", "Outdoor Activities"],
    verified: false,
    mutualConnections: [
      { name: "Lily Chen", avatar: undefined },
      { name: "Connor Murphy", avatar: undefined }
    ],
    mutualConnectionsCount: 3,
    description: "Environmental Science Junior • Sustainability Focus"
  }
];

// Mock stats
const chapterStats = {
  totalMembers: chapterMembers.length,
  activeMembers: chapterMembers.length,
  officers: chapterMembers.filter(m => m.position).length,
  events: 12,
  committees: 5,
  alumniConnections: 45
};

export function MyChapterPage() {
  const handleNavigate = (section: string) => {
    console.log(`Navigating to: ${section}`);
    // TODO: Implement navigation logic
    switch (section) {
      case 'add-member':
        console.log('Opening add member modal/form');
        break;
      case 'create-event':
        console.log('Opening create event modal/form');
        break;
      default:
        console.log(`Navigating to ${section} section`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Column - Sidebar */}
      <MyChapterSidebar 
        stats={chapterStats} 
        onNavigate={handleNavigate} 
      />
      
      {/* Right Column - Main Content */}
      <MyChapterContent 
        onNavigate={handleNavigate} 
      />
    </div>
  );
} 