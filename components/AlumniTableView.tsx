import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
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
  GraduationCap,
  Calendar,
  Tag,
  Users,
  Check,
  X
} from "lucide-react";
import { Alumni } from "@/lib/mockAlumni";

interface AlumniTableViewProps {
  alumni: Alumni[];
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type SortField = 'name' | 'company' | 'industry' | 'graduationYear' | 'location' | 'jobTitle' | 'chapter' | 'lastContact';
type SortDirection = 'asc' | 'desc';

export function AlumniTableView({ alumni, selectedAlumni, onSelectionChange }: AlumniTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [accessedEmails, setAccessedEmails] = useState<Set<string>>(new Set());
  const [accessedPhones, setAccessedPhones] = useState<Set<string>>(new Set());
  const [selectedAlumniForPopup, setSelectedAlumniForPopup] = useState<Alumni | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

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

  const handleAccessEmail = (alumniId: string) => {
    setAccessedEmails(prev => new Set([...prev, alumniId]));
  };

  const handleAccessPhone = (alumniId: string) => {
    setAccessedPhones(prev => new Set([...prev, alumniId]));
  };

  const handleAlumniNameClick = (alumni: Alumni) => {
    setSelectedAlumniForPopup(alumni);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedAlumniForPopup(null);
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
      case 'chapter':
        aValue = a.chapter;
        bValue = b.chapter;
        break;
      case 'lastContact':
        aValue = a.lastContact || '';
        bValue = b.lastContact || '';
        break;
      default:
        aValue = a.fullName;
        bValue = b.fullName;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-navy-600" /> : 
      <ChevronDown className="h-4 w-4 text-navy-600" />;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full">
      {/* Alumni Popup Sheet */}
      <Sheet open={popupOpen} onOpenChange={setPopupOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold text-gray-900">
                Alumni Profile
              </SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePopup}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="p-6">
            {selectedAlumniForPopup && (
              <LinkedInStyleAlumniCard
                name={selectedAlumniForPopup.fullName}
                description={selectedAlumniForPopup.description}
                mutualConnections={selectedAlumniForPopup.mutualConnections}
                mutualConnectionsCount={selectedAlumniForPopup.mutualConnectionsCount}
                avatar={selectedAlumniForPopup.avatar}
                verified={selectedAlumniForPopup.verified}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                <TableHead className="bg-gray-50 border-r border-gray-200 w-12">
                  <div className="flex justify-center items-center h-full">
                    <Checkbox
                      checked={selectedAlumni.length === alumni.length && alumni.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                    />
                  </div>
                </TableHead>
                <TableHead 
                  className=" bg-gray-50 border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors min-w-[200px]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-2">
                    <span>NAME</span>
                    <SortIcon field="name" />
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[150px]"
                  onClick={() => handleSort('jobTitle')}
                >
                  <div className="flex items-center space-x-2">
                    <span>JOB TITLE</span>
                    <SortIcon field="jobTitle" />
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[150px]"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center space-x-2">
                    <span>COMPANY</span>
                    <SortIcon field="company" />
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                  onClick={() => handleSort('industry')}
                >
                  <div className="flex items-center space-x-2">
                    <span>INDUSTRY</span>
                    <SortIcon field="industry" />
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                  onClick={() => handleSort('chapter')}
                >
                  <div className="flex items-center space-x-2">
                    <span>CHAPTER</span>
                    <SortIcon field="chapter" />
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                  onClick={() => handleSort('graduationYear')}
                >
                  <div className="flex items-center space-x-2">
                    <span>GRAD YEAR</span>
                    <SortIcon field="graduationYear" />
                  </div>
                </TableHead>
                <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <span>EMAILS</span>
                  </div>
                </TableHead>
                <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[120px]">
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
                <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <span>MUTUAL CONNECTIONS</span>
                  </div>
                </TableHead>
                <TableHead 
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[120px]"
                  onClick={() => handleSort('lastContact')}
                >
                  <div className="flex items-center space-x-2">
                    <span>LAST CONTACT</span>
                    <SortIcon field="lastContact" />
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
                  <TableCell className=" bg-white border-r border-gray-200 w-12">
                    <div className="flex justify-center items-center h-full">
                      <Checkbox
                        checked={selectedAlumni.includes(alumni.id)}
                        onCheckedChange={(checked) => handleSelectAlumni(alumni.id, checked as boolean)}
                        className="data-[state=checked]:bg-navy-600 data-[state=checked]:border-navy-600"
                      />
                    </div>
                  </TableCell>
                  <TableCell className=" bg-white border-r border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {alumni.firstName?.[0] || ''}{alumni.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="font-medium text-gray-900 underline cursor-pointer hover:text-navy-600 transition-colors"
                            onClick={() => handleAlumniNameClick(alumni)}
                          >
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
                    <span className="text-gray-900 text-sm">{alumni.jobTitle || 'N/A'}</span>
                  </TableCell>
                  
                  {/* Company Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 text-sm">{alumni.company || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  {/* Industry Column */}
                  <TableCell className="bg-white">
                    <Badge variant="outline" className="text-xs">
                      {alumni.industry || 'N/A'}
                    </Badge>
                  </TableCell>
                  
                  {/* Chapter Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 text-sm">{alumni.chapter || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  {/* Graduation Year Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 text-sm">{alumni.graduationYear || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  {/* Emails Column */}
                  <TableCell className="bg-white">
                    {accessedEmails.has(alumni.id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-1 w-1 text-white" />
                        </div>
                        <span className="text-gray-900 text-sm">{alumni.email}</span>
                      </div>
                    ) : alumni.email ? (
                      <Button 
                        size="sm" 
                        className="h-8 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-600 hover:to-gray-800  text-white border-gray-800 text-xs whitespace-nowrap shadow-sm"
                        onClick={() => handleAccessEmail(alumni.id)}
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full flex items-center justify-center mr-2">
                          <Check className="h-1 w-1 text-white" />
                        </div>
                        Access email
                      </Button>
                    ) : (
                      <span className="text-gray-500 text-sm">No email available</span>
                    )}
                  </TableCell>
                  
                  {/* Phone Numbers Column */}
                  <TableCell className="bg-white">
                    {accessedPhones.has(alumni.id) ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-900 text-sm">{alumni.phone}</span>
                      </div>
                    ) : alumni.phone ? (
                      <Button 
                        size="sm" 
                        className="h-8 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-600 hover:to-gray-800  text-white border-gray-800 text-xs whitespace-nowrap shadow-sm"
                        onClick={() => handleAccessPhone(alumni.id)}
                      >
                        <Phone className="h-3 w-3 mr-2" />
                        Access Mobile
                      </Button>
                    ) : (
                      <span className="text-gray-500 text-sm">Request phone number</span>
                    )}
                  </TableCell>
                  
                  {/* Location Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 text-sm">{alumni.location || 'N/A'}</span>
                    </div>
                  </TableCell>
                  
                  {/* Mutual Connections Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 text-sm">
                        {alumni.mutualConnectionsCount || alumni.mutualConnections?.length || 0}
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Last Contact Column */}
                  <TableCell className="bg-white">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 text-sm">{formatDate(alumni.lastContact)}</span>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 