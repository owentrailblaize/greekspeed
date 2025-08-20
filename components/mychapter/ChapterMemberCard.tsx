import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChapterMember } from "@/types/chapter";

// LEGACY COMPONENT: This is the old card design
// The new LinkedInStyleChapterCard is now used in MyChapterContent
interface ChapterMemberCardProps {
  member: ChapterMember;
}

export function ChapterMemberCard({ member }: ChapterMemberCardProps) {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-navy-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {member.name.split(' ').map((n: string) => n[0]).join('')}
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
              {member.interests?.slice(0, 2).map((interest: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {interest}
                </Badge>
              ))}
              {member.interests && member.interests.length > 2 && (
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