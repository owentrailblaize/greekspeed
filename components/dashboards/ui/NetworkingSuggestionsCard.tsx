'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

// Mock data for networking suggestions
const networkingSuggestions = [
  {
    id: 1,
    full_name: "Dr. Michael Chen",
    grad_year: 2018,
    job_title: "Senior Software Engineer",
    company: "TechCorp",
    is_actively_hiring: true
  },
  {
    id: 2,
    full_name: "Jennifer Rodriguez",
    grad_year: 2020,
    job_title: "Marketing Manager",
    company: "Global Brands Inc.",
    is_actively_hiring: false
  },
  {
    id: 3,
    full_name: "Alex Thompson",
    grad_year: 2019,
    job_title: "Financial Analyst",
    company: "Merchant Bank",
    is_actively_hiring: true
  }
];

export function NetworkingSuggestionsCard() {
  const [connections, setConnections] = useState<Set<number>>(new Set());

  const handleConnect = (profileId: number) => {
    setConnections(prev => new Set(prev).add(profileId));
  };

  const isConnected = (profileId: number) => connections.has(profileId);

  if (networkingSuggestions.length === 0) {
    return null; // Hide component if no suggestions
  }

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Users className="h-5 w-5 text-navy-600" />
          <span>Networking Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {networkingSuggestions.map((profile) => (
            <div key={profile.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-600 text-sm font-semibold shrink-0">
                  {profile.full_name.split(' ').map(n => n[0]).join('')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{profile.full_name}</h4>
                    {profile.is_actively_hiring && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Hiring
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1 truncate">{profile.job_title} at {profile.company}</p>
                  <p className="text-xs text-gray-500 mb-2">Class of {profile.grad_year}</p>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleConnect(profile.id)}
                    disabled={isConnected(profile.id)}
                    className="text-navy-600 border-navy-600 hover:bg-navy-50 text-xs h-7 px-2 w-full"
                  >
                    {isConnected(profile.id) ? 'Requested' : 'Connect'}
                  </Button>
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
  );
} 