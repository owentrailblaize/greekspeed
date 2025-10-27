import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AlumniCardProps {
  name: string;
  pledgeYear: string;
  role: string;
  company: string;
  tags: string[];
  avatar?: string;
}

export function AlumniCard({ name, pledgeYear, role, company, tags }: AlumniCardProps) {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 bg-navy-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                <p className="text-sm text-gray-600">Class of {pledgeYear}</p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">{role}</p>
              <p className="text-sm text-gray-600">{company}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>

            <Button className="w-full mt-4 bg-navy-600 hover:bg-navy-700 text-white rounded-lg" size="sm">
              Connect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 