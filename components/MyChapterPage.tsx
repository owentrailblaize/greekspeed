import { Search, Filter, GraduationCap, Users } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface ChapterMember {
  id: string;
  name: string;
  year: string;
  major: string;
  position?: string;
  interests: string[];
  avatar?: string;
}

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

function ChapterMemberCard({ member }: { member: ChapterMember }) {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-navy-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {member.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{member.name}</h3>
                <p className="text-sm text-gray-600">{member.year} • {member.major}</p>
                {member.position && (
                  <p className="text-sm font-medium text-navy-600">{member.position}</p>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-1">
              {member.interests.slice(0, 2).map((interest, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {interest}
                </Badge>
              ))}
              {member.interests.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                  +{member.interests.length - 2}
                </Badge>
              )}
            </div>
            
            <Button 
              className="w-full mt-4 bg-navy-600 hover:bg-navy-700 text-white rounded-lg"
              size="sm"
            >
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MyChapterPage() {
  const officers = chapterMembers.filter(member => member.position);
  const generalMembers = chapterMembers.filter(member => !member.position);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-navy-600" />
              <h1 className="text-navy-900 font-medium">My Chapter</h1>
            </div>
            <Button className="bg-navy-600 hover:bg-navy-700 text-white">
              Add Member
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members by name, major, or interests..."
                className="pl-10 bg-white border-gray-300 focus:border-navy-500 focus:ring-navy-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              
              <Select>
                <SelectTrigger className="w-32 bg-white border-gray-300">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freshman">Freshman</SelectItem>
                  <SelectItem value="sophomore">Sophomore</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-40 bg-white border-gray-300">
                  <SelectValue placeholder="Major" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="cs">Computer Science</SelectItem>
                  <SelectItem value="premed">Pre-Med</SelectItem>
                  <SelectItem value="liberal-arts">Liberal Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-navy-600" />
            <h2 className="text-navy-900 font-medium">Chapter Officers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officers.map((member) => (
              <ChapterMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-navy-600" />
            <h2 className="text-navy-900 font-medium">General Members</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generalMembers.map((member) => (
              <ChapterMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}