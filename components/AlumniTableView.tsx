import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LinkedInStyleAlumniCard } from "@/components/LinkedInStyleAlumniCard";
import { useConnections } from "@/lib/hooks/useConnections";
import { useAuth } from "@/lib/supabase/auth-context";
import { 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  UserPlus, 
  ArrowUpDown,
  MapPin,
  Users,
  Check,
  X,
  Clock,
  MessageCircle,
  GraduationCap,
  Calendar
} from "lucide-react";
import { Alumni } from "@/lib/mockAlumni";
import { AlumniProfileModal } from "@/components/AlumniProfileModal";

interface AlumniTableViewProps {
  alumni: Alumni[];
  selectedAlumni: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type SortField = 'name' | 'company' | 'industry' | 'graduationYear' | 'location' | 'jobTitle' | 'chapter' | 'lastContact' | 'isActivelyHiring';
type SortDirection = 'asc' | 'desc';

export function AlumniTableView({ alumni, selectedAlumni, onSelectionChange }: AlumniTableViewProps) {
  const { user } = useAuth();
  const { 
    sendConnectionRequest, 
    updateConnectionStatus, 
    cancelConnectionRequest, 
    getConnectionStatus,
    getConnectionId
  } = useConnections();
  
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [accessedEmails, setAccessedEmails] = useState<Set<string>>(new Set());
  const [accessedPhones, setAccessedPhones] = useState<Set<string>>(new Set());
  const [selectedAlumniForPopup, setSelectedAlumniForPopup] = useState<Alumni | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [connectionLoading, setConnectionLoading] = useState<string | null>(null);

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
      const allIds = alumni.map(a => a.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectAlumni = (alumniId: string, checked: boolean) => {
    if (checked) {
      const newSelection = [...selectedAlumni, alumniId];
      onSelectionChange(newSelection);
    } else {
      const newSelection = selectedAlumni.filter(id => id !== alumniId);
      onSelectionChange(newSelection);
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

  const handleConnectionAction = async (alumniId: string, action: 'connect' | 'accept' | 'decline' | 'cancel') => {
    if (!user) return;
    
    setConnectionLoading(alumniId);
    try {
      switch (action) {
        case 'connect':
          await sendConnectionRequest(alumniId, 'Would love to connect!');
          break;
        case 'accept':
          const connectionId = getConnectionId(alumniId);
          if (connectionId) {
            await updateConnectionStatus(connectionId, 'accepted');
          }
          break;
        case 'decline':
          const declineConnectionId = getConnectionId(alumniId);
          if (declineConnectionId) {
            await updateConnectionStatus(declineConnectionId, 'declined');
          }
          break;
        case 'cancel':
          const cancelConnectionId = getConnectionId(alumniId);
          if (cancelConnectionId) {
            await cancelConnectionRequest(cancelConnectionId);
          }
          break;
      }
    } catch (error) {
      console.error('Connection action failed:', error);
    } finally {
      setConnectionLoading(null);
    }
  };

  const renderConnectionButton = (alumniId: string, hasProfile?: boolean) => {
    if (!user || user.id === alumniId) return null;
    
    // Don't show connection button if alumni doesn't have a linked profile
    if (!hasProfile) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-gray-400 border-gray-200 text-xs"
          disabled
        >
          No Profile
        </Button>
      );
    }
    
    const status = getConnectionStatus(alumniId);
    const isLoading = connectionLoading === alumniId;

    switch (status) {
      case 'none':
        return (
          <Button
            size="sm"
            onClick={() => handleConnectionAction(alumniId, 'connect')}
            disabled={isLoading}
            className="h-8 bg-navy-600 hover:bg-navy-700 text-white text-xs"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2" />
            ) : (
              <UserPlus className="h-3 w-3 mr-2" />
            )}
            Connect
          </Button>
        );
      
      case 'pending_sent':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleConnectionAction(alumniId, 'cancel')}
            disabled={isLoading}
            className="h-8 text-gray-600 border-gray-300 text-xs"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-2" />
            ) : (
              <Clock className="h-3 w-3 mr-2" />
            )}
            Requested
          </Button>
        );
      
      case 'pending_received':
        return (
          <div className="flex space-x-1">
            <Button
              size="sm"
              onClick={() => handleConnectionAction(alumniId, 'accept')}
              disabled={isLoading}
              className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleConnectionAction(alumniId, 'decline')}
              disabled={isLoading}
              className="h-8 text-red-600 border-red-300 text-xs"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
        );
      
      case 'accepted':
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-green-50 text-green-700 border-green-300 text-xs"
            disabled
          >
            <MessageCircle className="h-3 w-3 mr-2" />
            Connected
          </Button>
        );
      
      case 'declined':
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-gray-400 border-gray-200 text-xs"
            disabled
          >
            Declined
          </Button>
        );
      
      default:
        return null;
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
      case 'chapter':
        aValue = a.chapter;
        bValue = b.chapter;
        break;
      case 'lastContact':
        aValue = a.lastContact || '';
        bValue = b.lastContact || '';
        break;
      case 'isActivelyHiring':
        aValue = a.isActivelyHiring ? 1 : 0;
        bValue = b.isActivelyHiring ? 1 : 0;
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

  // Add computed values for selection state
  const isAllSelected = selectedAlumni.length === alumni.length && alumni.length > 0;
  const isIndeterminate = selectedAlumni.length > 0 && selectedAlumni.length < alumni.length;
  


  // Add SelectionStatus component
  const SelectionStatus = () => {
    if (selectedAlumni.length === 0) return null;
    
    return (
      <div className="px-4 py-2 bg-navy-50 border-b border-navy-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-navy-700">
            {selectedAlumni.length} of {alumni.length} alumni selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="text-navy-600 hover:text-navy-700"
          >
            Clear selection
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Selection Status */}
      <SelectionStatus />

      {/* Alumni Profile Modal - Replace the Sheet with this */}
      <AlumniProfileModal
        alumni={selectedAlumniForPopup}
        isOpen={popupOpen}
        onClose={handleClosePopup}
      />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
        <div className="overflow-x-auto h-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200 hover:bg-gray-50">
                                 <TableHead 
                   className="bg-gray-50 border-r border-gray-200 w-12"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <div className="flex justify-center items-center h-full p-2">
                     <Checkbox
                       checked={isAllSelected}
                       onCheckedChange={handleSelectAll}
                       indeterminate={isIndeterminate}
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
                  className="bg-gray-50 text-gray-900 font-medium cursor-pointer hover:bg-gray-100 transition-colors min-w-[100px]"
                  onClick={() => handleSort('isActivelyHiring')}
                >
                  <div className="flex items-center space-x-2">
                    <span>HIRING</span>
                    <SortIcon field="isActivelyHiring" />
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
                <TableHead className="bg-gray-50 text-gray-900 font-medium min-w-[120px]">
                  <div className="flex items-center space-x-2">
                    <span>CONNECTION</span>
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
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                    selectedAlumni.includes(alumni.id) ? 'bg-navy-50 border-navy-200' : ''
                  }`}
                >
                                     {/* Checkbox Column */}
                   <TableCell 
                     className=" bg-white border-r border-gray-200 w-12"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <div className="flex justify-center items-center h-full p-2">
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
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Job Title Column */}
                  <TableCell className="bg-white">
                    <span className="text-gray-900 text-sm">{alumni.jobTitle || 'N/A'}</span>
                  </TableCell>
                  
                  {/* Hiring Column - NEW */}
                  <TableCell className="bg-white">
                    {alumni.isActivelyHiring ? (
                      <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-600 hover:to-gray-800 text-white text-xs px-2 py-1">
                        Hiring
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
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
                  
                  {/* Connection Column */}
                  <TableCell className="bg-white">
                    {renderConnectionButton(alumni.id, alumni.hasProfile)}
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