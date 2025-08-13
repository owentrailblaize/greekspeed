"use client";

import { useState } from "react";
import { MyChapterSidebar } from "./MyChapterSidebar";
import { MyChapterContent } from "./MyChapterContent";
import { ChapterMember, ChapterStats } from "./types";

// Mock data for current chapter members
const chapterMembers: ChapterMember[] = [
  {
    id: "1",
    name: "Jake Williams",
    year: "Senior",
    major: "Computer Science",
    position: "President",
    interests: ["Leadership", "Tech", "Networking"]
  },
  {
    id: "2",
    name: "Sofia Rodriguez",
    year: "Junior",
    major: "Business Administration",
    position: "Vice President",
    interests: ["Business Strategy", "Marketing", "Finance"]
  },
  {
    id: "3",
    name: "Marcus Johnson",
    year: "Sophomore",
    major: "Mechanical Engineering",
    position: "Treasurer",
    interests: ["Engineering", "Innovation", "Sports"]
  },
  {
    id: "4",
    name: "Lily Chen",
    year: "Senior",
    major: "Psychology",
    interests: ["Research", "Mental Health", "Community Service"]
  },
  {
    id: "5",
    name: "Ethan Davis",
    year: "Junior",
    major: "Economics",
    interests: ["Finance", "Investment", "Analytics"]
  },
  {
    id: "6",
    name: "Maya Patel",
    year: "Sophomore",
    major: "Pre-Med",
    interests: ["Healthcare", "Research", "Volunteering"]
  },
  {
    id: "7",
    name: "Connor Murphy",
    year: "Senior",
    major: "Marketing",
    position: "Social Chair",
    interests: ["Creative Design", "Social Media", "Events"]
  },
  {
    id: "8",
    name: "Zoe Thompson",
    year: "Junior",
    major: "Environmental Science",
    interests: ["Sustainability", "Research", "Outdoor Activities"]
  }
];

// Mock stats
const chapterStats: ChapterStats = {
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
        members={chapterMembers} 
        onNavigate={handleNavigate} 
      />
    </div>
  );
} 