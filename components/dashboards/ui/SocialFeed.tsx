'use client';


import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

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

export function SocialFeed() {
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
    <div className="space-y-4">
      {/* Create Post Card */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
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
                  {post.timestamp}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 