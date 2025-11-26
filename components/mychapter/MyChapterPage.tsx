"use client";

import { useState } from "react";
import { MyChapterSidebar } from "./MyChapterSidebar";
import { MyChapterContent } from "./MyChapterContent";

export function MyChapterPage() {
  // Default to "all" to show the original view
  const [activeSection, setActiveSection] = useState("all");
  const [searchTerm, setSearchTerm] = useState(""); // Add search state

  const handleNavigate = (section: string) => {
    // Navigating to section
    setActiveSection(section);
    
    // TODO: Implement navigation logic
    switch (section) {
      case 'add-member':
        // Opening add member modal/form
        break;
      case 'create-event':
        // Opening create event modal/form
        break;
      default:
        // Navigating to section
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* The MyChapterSidebar now handles its own layout */}
      <MyChapterSidebar 
        onNavigate={handleNavigate}
        activeSection={activeSection}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      {/* MyChapterContent will be rendered inside the sidebar's main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <MyChapterContent 
          onNavigate={handleNavigate}
          activeSection={activeSection}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
} 