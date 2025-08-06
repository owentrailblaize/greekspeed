import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Mail, Phone, UserPlus, MoreHorizontal } from "lucide-react";
import { Alumni } from "@/lib/mockAlumni";

interface AlumniTableViewProps {
  alumni: Alumni[];
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type SortField = 'name' | 'company' | 'industry' | 'graduationYear' | 'location';
type SortDirection = 'asc' | 'desc';

export function AlumniTableView({ alumni, selectedAlumni, onSelectionChange }: AlumniTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(alumni.map(a => a.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectAlumni = (alumniId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAlumni, alumniId]);
    } else {
      onSelectionChange(selectedAlumni.filter(id => id !== alumniId));
    }
  };

  const sortedAlumni = [...alumni].sort((a, b) => {
    let aValue: string | number, bValue: string | number;
    
    switch (sortField) {
      case 'name':
        aValue = a.fullName;
        bValue = b.fullName;
        break;
      case 'company':
        aValue = a.company;
        bValue = b.company;
        break;
      case 'industry':
        aValue = a.industry;
        bValue = b.industry;
        break;
      case 'graduationYear':
        aValue = a.graduationYear;
        bValue = b.graduationYear;
        break;
      case 'location':
        aValue = a.location;
        bValue = b.location;
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedAlumni.length === alumni.length && alumni.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center space-x-1">
                  <span>Company</span>
                  <SortIcon field="company" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('industry')}
              >
                <div className="flex items-center space-x-1">
                  <span>Industry</span>
                  <SortIcon field="industry" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('graduationYear')}
              >
                <div className="flex items-center space-x-1">
                  <span>Graduation Year</span>
                  <SortIcon field="graduationYear" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center space-x-1">
                  <span>Location</span>
                  <SortIcon field="location" />
                </div>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAlumni.map((alumni) => (
              <motion.tr
                key={alumni.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <Checkbox
                    checked={selectedAlumni.includes(alumni.id)}
                    onCheckedChange={(checked) => handleSelectAlumni(alumni.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {alumni.firstName[0]}{alumni.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{alumni.fullName}</span>
                        {alumni.verified && (
                          <Badge className="bg-blue-500 text-white text-xs">✓</Badge>
                        )}
                        {alumni.isActivelyHiring && (
                          <Badge className="bg-green-500 text-white text-xs">Hiring</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{alumni.jobTitle}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{alumni.company}</div>
                    <div className="text-sm text-gray-500">{alumni.chapter}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {alumni.industry}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{alumni.graduationYear}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{alumni.location}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="h-8">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 