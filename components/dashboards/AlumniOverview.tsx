'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, MapPin, Clock, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

// Mock data for social feed (LinkedIn-style posts)
const socialFeed = [
  {
    id: 1,
    author: {
      name: "Sarah Johnson",
      title: "Chapter President @ Delta Gamma",
      avatar: "SJ",
      chapter: "Delta Gamma",
      gradYear: 2024
    },
    content: "Excited to announce our new mentorship program launching next month! We're connecting current members with successful alumni in their fields. This is going to be a game-changer for our chapter's professional development.",
    timestamp: "2h ago",
    likes: 24,
    comments: 8,
    shares: 3,
    type: "announcement"
  },
  {
    id: 2,
    author: {
      name: "Michael Chen",
      title: "Senior Software Engineer @ TechCorp",
      avatar: "MC",
      chapter: "Delta Gamma",
      gradYear: 2018
    },
    content: "Just wrapped up our spring formal and it was incredible! Over 150 members and alumni came together. The energy was amazing and it reminded me why I love being part of this chapter. Special shoutout to the social committee for pulling this off!",
    timestamp: "5h ago",
    likes: 67,
    comments: 23,
    shares: 12,
    type: "event"
  },
  {
    id: 3,
    author: {
      name: "Jennifer Rodriguez",
      title: "Marketing Manager @ Global Brands",
      avatar: "JR",
      chapter: "Delta Gamma",
      gradYear: 2020
    },
    content: "We're hiring! Looking for 2 marketing interns for the summer. Must be current Delta Gamma members. Great opportunity to work with a Fortune 500 company. DM me if interested!",
    timestamp: "1d ago",
    likes: 89,
    comments: 45,
    shares: 18,
    type: "hiring"
  },
  {
    id: 4,
    author: {
      name: "Alex Thompson",
      title: "Financial Analyst @ Merchant Bank",
      avatar: "AT",
      chapter: "Delta Gamma",
      gradYear: 2019
    },
    content: "Community service update: Our chapter completed 500+ hours this semester, exceeding our goal by 20%! Proud of everyone who participated. Service is at the heart of what we do.",
    timestamp: "2d ago",
    likes: 156,
    comments: 34,
    shares: 28,
    type: "service"
  },
  {
    id: 5,
    author: {
      name: "David Wilson",
      title: "Graduate Student @ Stanford",
      avatar: "DW",
      chapter: "Delta Gamma",
      gradYear: 2022
    },
    content: "Just got accepted to Stanford's MBA program! Delta Gamma taught me so much about leadership and networking. Can't wait to represent our chapter on the West Coast.",
    timestamp: "3d ago",
    likes: 203,
    comments: 67,
    shares: 41,
    type: "achievement"
  }
];

// Mock data for upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Alumni Mixer & Networking",
    date: "March 22, 2024",
    time: "6:00 PM - 9:00 PM",
    location: "Downtown Conference Center",
    rsvpStatus: "open",
    attendees: 45,
    image: "🎉"
  },
  {
    id: 2,
    title: "Chapter 50th Anniversary Celebration",
    date: "April 15, 2024",
    time: "2:00 PM - 8:00 PM",
    location: "Chapter House & Campus",
    rsvpStatus: "open",
    attendees: 120,
    image: "🎂"
  },
  {
    id: 3,
    title: "Professional Development Workshop",
    date: "April 28, 2024",
    time: "10:00 AM - 2:00 PM",
    location: "Business School Auditorium",
    rsvpStatus: "open",
    attendees: 35,
    image: "📚"
  },
  {
    id: 4,
    title: "Summer BBQ & Networking",
    date: "May 10, 2024",
    time: "4:00 PM - 8:00 PM",
    location: "Riverside Park",
    rsvpStatus: "open",
    attendees: 78,
    image: "🍖"
  }
];

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

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  rsvpStatus: string;
  attendees: number;
  image: string;
}

interface Profile {
  id: number;
  name: string;
  // Remove title property since it's not in networkingSpotlight data
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
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handleRSVP = (event: Event) => {
    setSelectedEvent(event);
    setRsvpModalOpen(true);
    console.log('RSVP for event:', event.title);
  };

  const handleConnect = (profile: Profile) => {
    setSelectedProfile(profile);
    setConnectModalOpen(true);
    console.log('Connect with:', profile.name);
  };

  const handleLike = (postId: number) => {
    console.log('Liked post:', postId);
  };

  const handleComment = (postId: number) => {
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: number) => {
    console.log('Share post:', postId);
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-green-100 text-green-800';
      case 'hiring': return 'bg-purple-100 text-purple-800';
      case 'service': return 'bg-orange-100 text-orange-800';
      case 'achievement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-full mx-auto">
          <h1 className="text-2xl font-bold text-navy-900">Alumni Dashboard</h1>
          <p className="text-gray-600">Stay connected with your chapter and network with fellow alumni</p>
        </div>
      </div>

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
            <div className="space-y-4">
              {/* Create Post Card */}
              <Card className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Simple Avatar using div */}
                    <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                      You
                    </div>
                    <div className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-gray-500 hover:text-gray-700 border-gray-300"
                        onClick={() => console.log('Create post')}
                      >
                        Start a post...
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Feed Posts */}
              {socialFeed.map((post) => (
                <Card key={post.id} className="bg-white">
                  <CardContent className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start space-x-3 mb-3">
                      {/* Simple Avatar using div */}
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                        {post.author.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900 text-sm">{post.author.name}</h4>
                          <Badge className={getPostTypeColor(post.type)}>
                            {post.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{post.author.title}</p>
                        <p className="text-xs text-gray-500">{post.timestamp}</p>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-900 text-sm leading-relaxed">{post.content}</p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-6">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLike(post.id)}
                          className="text-gray-500 hover:text-red-500 hover:bg-red-50"
                        >
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleComment(post.id)}
                          className="text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleShare(post.id)}
                          className="text-gray-500 hover:text-green-500 hover:bg-green-50"
                        >
                          <Share className="h-4 w-4 mr-1" />
                          {post.shares}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Upcoming Events */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <Card className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-navy-600" />
                    <span>Upcoming Events</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-center mb-3">
                          <div className="text-3xl mb-2">{event.image}</div>
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{event.title}</h4>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-600 mb-3">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-3 w-3" />
                            <span>{event.date} • {event.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3" />
                            <span>{event.attendees} attending</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {event.rsvpStatus === 'open' ? 'Open' : 'Closed'}
                          </Badge>
                          <Button 
                            size="sm" 
                            onClick={() => handleRSVP(event)}
                            className="bg-navy-600 hover:bg-navy-700 text-white text-xs h-7 px-3"
                          >
                            RSVP
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <Button variant="outline" className="w-full text-navy-600 border-navy-600 hover:bg-navy-50">
                      View All Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {rsvpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">RSVP for {selectedEvent?.title}</h3>
            <p className="text-gray-600 mb-4">RSVP functionality coming soon!</p>
            <div className="flex space-x-2">
              <Button onClick={() => setRsvpModalOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

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