'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { PersonalAlumniProfile } from './ui/PersonalAlumniProfile';
import { SocialFeed } from './ui/SocialFeed';
import { useProfile } from '@/lib/hooks/useProfile';

// Mock data for networking spotlight
const networkingSpotlight = [
  {
    id: 1,
    name: "Dr. Michael Chen",
    chapter: "Delta Gamma",
    gradYear: 2018,
    jobTitle: "Senior Software Engineer",
    company: "TechCorp",
    isActivelyHiring: true,
    location: "San Francisco, CA",
    avatar: "MC",
    mutualConnections: 12
  },
  {
    id: 2,
    name: "Jennifer Rodriguez",
    chapter: "Delta Gamma",
    gradYear: 2020,
    jobTitle: "Marketing Manager",
    company: "Global Brands Inc.",
    isActivelyHiring: false,
    location: "New York, NY",
    avatar: "JR",
    mutualConnections: 8
  },
  {
    id: 3,
    name: "Alex Thompson",
    chapter: "Delta Gamma",
    gradYear: 2019,
    jobTitle: "Financial Analyst",
    company: "Merchant Bank",
    isActivelyHiring: true,
    location: "Chicago, IL",
    avatar: "AT",
    mutualConnections: 15
  },
  {
    id: 4,
    name: "Sarah Kim",
    chapter: "Delta Gamma",
    gradYear: 2021,
    jobTitle: "UX Designer",
    company: "Creative Studios",
    isActivelyHiring: false,
    location: "Austin, TX",
    avatar: "SK",
    mutualConnections: 6
  },
  {
    id: 5,
    name: "Robert Davis",
    chapter: "Delta Gamma",
    gradYear: 2017,
    jobTitle: "Product Manager",
    company: "Innovation Labs",
    isActivelyHiring: true,
    location: "Seattle, WA",
    avatar: "RD",
    mutualConnections: 20
  }
];

interface Profile {
  id: number;
  name: string;
  avatar: string;
  chapter: string;
  gradYear: number;
  jobTitle: string;
  company: string;
  isActivelyHiring: boolean;
  location: string;
  mutualConnections: number;
}

export function AlumniOverview() {
  const { profile } = useProfile();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handleConnect = (profile: Profile) => {
    setSelectedProfile(profile);
    setConnectModalOpen(true);
    console.log('Connect with:', profile.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Three Column Layout */}
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar - Networking Spotlight */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Users className="h-5 w-5 text-navy-600" />
                    <span>Networking Spotlight</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {networkingSpotlight.map((profile) => (
                      <div key={profile.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-3">
                          {/* Simple Avatar using div instead of Avatar component */}
                          <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                            {profile.avatar}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-gray-900 text-sm truncate">{profile.name}</h4>
                              {profile.isActivelyHiring && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Hiring
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-1 truncate">{profile.jobTitle} at {profile.company}</p>
                            <p className="text-xs text-gray-500 mb-2">{profile.location}</p>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">{profile.mutualConnections} mutual</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleConnect(profile)}
                                className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2"
                              >
                                Connect
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
                      Browse More Profiles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Center Column - Social Feed */}
          <div className="col-span-6">
            <SocialFeed chapterId={profile?.chapter_id || ''} />
          </div>

          {/* Right Sidebar - Personal Alumni Profile */}
          <div className="col-span-3">
            <PersonalAlumniProfile />
          </div>
        </div>
      </div>

      {/* Modals */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Connect with {selectedProfile?.name}</h3>
            <p className="text-gray-600 mb-4">Connection functionality coming soon!</p>
            <div className="flex space-x-2">
              <Button onClick={() => setConnectModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 