'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Upload, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Lock,
  Building2,
  GraduationCap,
  MapPin,
  Briefcase,
  Mail
} from 'lucide-react';
import { BulkAlumniUpload } from './BulkAlumniUpload';

interface Alumni {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  chapter: string;
  industry: string;
  graduation_year: number;
  company: string;
  job_title: string;
  phone: string | null;
  location: string | null;
  description: string | null;
  pledge_class: string | null;
  major: string | null;
  hometown: string | null;
  verified: boolean;
  is_actively_hiring: boolean;
  created_at: string;
  updated_at: string;
}

export function AlumniTab() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      // Request ALL alumni without any pagination limits
      const response = await fetch('/api/alumni?limit=50000&page=1');
      if (response.ok) {
        const data = await response.json();
        setAlumni(data.alumni || []);
        console.log(`📊 Fetched ${data.alumni?.length || 0} alumni out of ${data.total || 0} total`);
      } else {
        console.error('Failed to fetch alumni');
      }
    } catch (error) {
      console.error('Error fetching alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(alumni =>
    (alumni.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (alumni.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (alumni.chapter?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (alumni.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (alumni.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alumni Management</h2>
          <p className="text-gray-600">Manage alumni profiles and bulk upload new alumni</p>
        </div>
        <Button 
          onClick={() => setShowBulkUpload(true)} 
          className="flex items-center space-x-2"
        >
          <Upload className="h-4 w-4" />
          <span>Bulk Upload Alumni</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search alumni by name, email, chapter, company, or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Alumni Table with Scrollable Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>All Alumni ({filteredAlumni.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading alumni...</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Scrollable container with fixed height */}
              <div className="max-h-[70vh] overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Alumni Info</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Chapter & Academic</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Professional</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Contact</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Status</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Created</th>
                      <th className="text-left p-3 font-medium text-sm bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlumni.map((alumni) => (
                      <tr key={alumni.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{alumni.full_name}</p>
                            <p className="text-sm text-gray-600">{alumni.email}</p>
                            <p className="text-xs text-gray-500">ID: {alumni.user_id}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{alumni.chapter}</span>
                            </div>
                            {alumni.graduation_year && (
                              <div className="flex items-center space-x-2">
                                <GraduationCap className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">Class of {alumni.graduation_year}</span>
                              </div>
                            )}
                            {alumni.pledge_class && (
                              <p className="text-xs text-gray-500">{alumni.pledge_class}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {alumni.company && (
                              <div className="flex items-center space-x-2">
                                <Briefcase className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{alumni.company}</span>
                              </div>
                            )}
                            {alumni.job_title && (
                              <p className="text-sm text-gray-600">{alumni.job_title}</p>
                            )}
                            {alumni.industry && (
                              <p className="text-xs text-gray-500">{alumni.industry}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {alumni.phone && (
                              <p className="text-sm">{alumni.phone}</p>
                            )}
                            {alumni.location && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{alumni.location}</span>
                              </div>
                            )}
                            {!alumni.phone && !alumni.location && (
                              <p className="text-xs text-gray-500">No contact info</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <Badge variant={alumni.verified ? "default" : "secondary"}>
                              {alumni.verified ? "Verified" : "Unverified"}
                            </Badge>
                            {alumni.is_actively_hiring && (
                              <Badge variant="destructive">Actively Hiring</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-600">
                            {formatDate(alumni.created_at)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Updated: {formatDate(alumni.updated_at)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Edit Button with Lock Indicator */}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                className="h-8 w-8 p-0 bg-gray-50 cursor-not-allowed opacity-60"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <div className="absolute -top-1 -right-1">
                                <Lock className="h-3 w-3 text-gray-500" />
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Footer */}
              <div className="mt-4 text-sm text-gray-600">
                <p>Showing {filteredAlumni.length} alumni records</p>
                {filteredAlumni.length > 1000 && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Use the search bar above to filter results for better performance
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkAlumniUpload 
          onClose={() => setShowBulkUpload(false)} 
          onSuccess={fetchAlumni} 
        />
      )}
    </div>
  );
}
