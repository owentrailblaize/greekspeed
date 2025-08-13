"use client";

import { Users, Calendar, Building, BookOpen, MapPin, GraduationCap, UserPlus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChapterStats } from "./types";

interface MyChapterSidebarProps {
  stats: ChapterStats;
  onNavigate: (section: string) => void;
}

export function MyChapterSidebar({ stats, onNavigate }: MyChapterSidebarProps) {
  const sidebarItems = [
    {
      id: "members",
      label: "Chapter Members",
      icon: Users,
      count: stats.totalMembers,
      description: "Active chapter members"
    },
    {
      id: "officers",
      label: "Officers & Leadership",
      icon: GraduationCap,
      count: stats.officers,
      description: "Chapter leadership team"
    },
    {
      id: "events",
      label: "Events & Activities",
      icon: Calendar,
      count: stats.events,
      description: "Upcoming and past events"
    },
    {
      id: "committees",
      label: "Committees",
      icon: Building,
      count: stats.committees,
      description: "Chapter committees"
    },
    {
      id: "alumni",
      label: "Alumni Network",
      icon: UserPlus,
      count: stats.alumniConnections,
      description: "Alumni connections"
    },
    {
      id: "resources",
      label: "Resources",
      icon: BookOpen,
      count: null,
      description: "Chapter resources & documents"
    },
    {
      id: "locations",
      label: "Chapter Locations",
      icon: MapPin,
      count: null,
      description: "Chapter locations & regions"
    },
    {
      id: "settings",
      label: "Chapter Settings",
      icon: Settings,
      count: null,
      description: "Manage chapter settings"
    }
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">Manage my chapter</h2>
        <p className="text-sm text-gray-600 mt-1">Organize and manage your chapter</p>
      </div>

      {/* Navigation Items */}
      <div className="space-y-2">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className="w-full justify-start h-auto p-3 hover:bg-gray-50"
            onClick={() => onNavigate(item.id)}
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="flex-shrink-0">
                <item.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.label}
                  </span>
                  {item.count !== null && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.count}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onNavigate('add-member')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Member
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onNavigate('create-event')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
} 