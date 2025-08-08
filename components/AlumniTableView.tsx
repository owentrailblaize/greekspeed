import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Phone, 
  UserPlus, 
  MoreHorizontal, 
  ExternalLink, 
  Send, 
  Plus, 
  ArrowUpDown,
  Building2,
  MapPin,
  GraduationCap
} from "lucide-react";
import { Alumni } from "@/lib/mockAlumni";

interface AlumniTableViewProps {
  alumni: Alumni[];
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type SortField = 'name' | 'company' | 'industry' | 'graduationYear' | 'location' | 'jobTitle';
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
      case 'jobTitle':
        aValue = a.jobTitle;
        bValue = b.jobTitle;
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
    <div className="w-full h-full bg-white flex flex-col">
      {/* Horizontal scrollable container */}
      <div className="flex-1 overflow-auto">
        <Table className="w-full min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
              <TableHead className="sticky left-0 z-20 bg-gray-50 border-r border-gray-200 w-12">
                <div className="flex justify-center items-center h-full">
                  <Checkbox
                    checked={selectedAlumni.length === alumni.length && alumni.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                  />
                </div>
              </TableHead>
              <TableHead 
                className="sticky left-12 z-20 bg-gray-50 border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-gray-900 font-medium">NAME</span>
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[150px]">
                <div className="flex items-center space-x-2">
                  <span>JOB TITLE</span>
                </div>
              </TableHead>
              <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[150px]">
                <div className="flex items-center space-x-2">
                  <span>COMPANY</span>
                </div>
              </TableHead>
              <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[120px]">
                <div className="flex items-center space-x-2">
                  <span>EMAILS</span>
                </div>
              </TableHead>
              <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[140px]">
                <div className="flex items-center space-x-2">
                  <span>PHONE NUMBERS</span>
                </div>
              </TableHead>
              <TableHead 
                className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                onClick={() => handleSort('location')}
              >
                <div className="flex items-center space-x-2">
                  <span>LOCATION</span>
                  <SortIcon field="location" />
                </div>
              </TableHead>
              <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[150px]">
                <div className="flex flex-col">
                  <span>COMPANY -</span>
                  <span>NUMBER OF EMPLOYEES</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAlumni.map((alumni) => (
              <motion.tr
                key={alumni.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Sticky Name Column */}
                <TableCell className="sticky left-0 z-10 bg-white border-r border-gray-200 w-12">
                  <div className="flex justify-center items-center h-full">
                    <Checkbox
                      checked={selectedAlumni.includes(alumni.id)}
                      onCheckedChange={(checked) => handleSelectAlumni(alumni.id, checked as boolean)}
                      className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                    />
                  </div>
                </TableCell>
                <TableCell className="sticky left-12 z-10 bg-white border-r border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {alumni.firstName[0]}{alumni.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 underline cursor-pointer hover:text-navy-600 transition-colors">
                          {alumni.fullName}
                        </span>
                        {alumni.verified && (
                          <Badge className="bg-navy-600 text-white text-xs px-1">✓</Badge>
                        )}
                        {alumni.isActivelyHiring && (
                          <Badge className="bg-green-500 text-white text-xs px-1">Hiring</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{alumni.jobTitle}</div>
                    </div>
                  </div>
                </TableCell>
                
                {/* Job Title Column */}
                <TableCell className="bg-white">
                  <span className="text-gray-900 text-sm">{alumni.jobTitle}</span>
                </TableCell>
                
                {/* Company Column */}
                <TableCell className="bg-white">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 text-sm">{alumni.company}</span>
                  </div>
                </TableCell>
                
                {/* Emails Column */}
                <TableCell className="bg-white">
                  <Button 
                    size="sm" 
                    className="h-8 bg-navy-600 hover:bg-navy-700 text-white border-navy-600 text-xs whitespace-nowrap"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Access email
                  </Button>
                </TableCell>
                
                {/* Phone Numbers Column */}
                <TableCell className="bg-white">
                  <Button 
                    size="sm" 
                    className="h-8 bg-navy-600 hover:bg-navy-700 text-white border-navy-600 text-xs whitespace-nowrap"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Access Mobile
                  </Button>
                </TableCell>
                
                {/* Location Column */}
                <TableCell className="bg-white">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 text-sm">{alumni.location}</span>
                  </div>
                </TableCell>
                
                {/* Company - Number of Employees Column */}
                <TableCell className="bg-white">
                  <span className="text-gray-900 text-sm">
                    {Math.floor(Math.random() * 1000) + 1}
                    {Math.random() > 0.7 ? 'K' : ''}
                    {Math.random() > 0.9 ? 'M' : ''}
                  </span>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 