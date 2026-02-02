'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Building2, MapPin, Users, Calendar, GraduationCap, Shield, Globe, BookOpen } from 'lucide-react';

interface Chapter {
  id: string;
  name: string;
  description: string;
  location: string;
  member_count: number;
  founded_year: number;
  university: string;
  slug: string;
  national_fraternity: string;
  chapter_name: string;
  school: string;
  school_location: string;
  chapter_status: string;
  created_at: string;
  updated_at: string;
}

interface ViewChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter;
}

export function ViewChapterModal({ isOpen, onClose, chapter }: ViewChapterModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>Chapter Details: {chapter.name}</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Chapter Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapter Name:</span>
                  <span className="font-medium">{chapter.chapter_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-medium">{chapter.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slug:</span>
                  <span className="font-mono text-xs text-gray-500">{chapter.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapter ID:</span>
                  <span className="font-mono text-xs text-gray-500">{chapter.id}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Status & Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={chapter.chapter_status === 'active' ? 'default' : 'secondary'}>
                    {chapter.chapter_status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Founded Year:</span>
                  <span className="font-medium">{chapter.founded_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Member Count:</span>
                  <span className="font-medium">{chapter.member_count}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location & University */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location & University</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{chapter.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">University:</span>
                <span className="font-medium">{chapter.university}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">School:</span>
                <span className="font-medium">{chapter.school}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">School Location:</span>
                <span className="font-medium">{chapter.school_location}</span>
              </div>
            </CardContent>
          </Card>

          {/* National Fraternity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>National Fraternity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">National Fraternity:</span>
                <span className="font-medium">{chapter.national_fraternity}</span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {chapter.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{chapter.description}</p>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(chapter.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(chapter.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
