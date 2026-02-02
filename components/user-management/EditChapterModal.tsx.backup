'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Building2 } from 'lucide-react';

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

interface EditChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: Chapter | null;
  onSuccess: () => void;
}

export function EditChapterModal({ isOpen, onClose, chapter, onSuccess }: EditChapterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    member_count: '',
    founded_year: '',
    university: '',
    national_fraternity: '',
    chapter_name: '',
    school: '',
    school_location: '',
    chapter_status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when chapter changes
  useEffect(() => {
    if (chapter) {
      setFormData({
        name: chapter.name || '',
        description: chapter.description || '',
        location: chapter.location || '',
        member_count: chapter.member_count?.toString() || '',
        founded_year: chapter.founded_year?.toString() || '',
        university: chapter.university || '',
        national_fraternity: chapter.national_fraternity || '',
        chapter_name: chapter.chapter_name || '',
        school: chapter.school || '',
        school_location: chapter.school_location || '',
        chapter_status: chapter.chapter_status || 'active'
      });
      setErrors({});
    }
  }, [chapter]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Chapter name is required';
    if (!formData.university.trim()) newErrors.university = 'University is required';
    if (!formData.national_fraternity.trim()) newErrors.national_fraternity = 'National fraternity is required';
    if (!formData.chapter_name.trim()) newErrors.chapter_name = 'Chapter name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.founded_year.trim()) newErrors.founded_year = 'Founded year is required';
    if (!formData.member_count.trim()) newErrors.member_count = 'Member count is required';

    // Validate founded year
    const year = parseInt(formData.founded_year);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear()) {
      newErrors.founded_year = 'Please enter a valid year between 1800 and current year';
    }

    // Validate member count
    const memberCount = parseInt(formData.member_count);
    if (isNaN(memberCount) || memberCount < 0) {
      newErrors.member_count = 'Please enter a valid member count';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chapter || !validateForm()) return;

    try {
      setLoading(true);

      const chapterData = {
        ...formData,
        member_count: parseInt(formData.member_count),
        founded_year: parseInt(formData.founded_year),
      };

      const response = await fetch(`/api/developer/chapters?chapterId=${chapter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chapterData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update chapter');
      }

      onSuccess();
      onClose();
      alert('Chapter updated successfully!');
      
    } catch (error) {
      console.error('Error updating chapter:', error);
      alert(`Failed to update chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !chapter) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <span>Edit Chapter: {chapter.name}</span>
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
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Same form fields as CreateChapterForm */}
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Chapter Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Sigma Chi Eta (Ole Miss)"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter_name">Chapter Name *</Label>
                <Input
                  id="chapter_name"
                  value={formData.chapter_name}
                  onChange={(e) => handleInputChange('chapter_name', e.target.value)}
                  placeholder="e.g., Eta"
                  className={errors.chapter_name ? 'border-red-500' : ''}
                />
                {errors.chapter_name && <p className="text-sm text-red-500">{errors.chapter_name}</p>}
              </div>
            </div>

            {/* National Fraternity & University */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="national_fraternity">National Fraternity *</Label>
                <Input
                  id="national_fraternity"
                  value={formData.national_fraternity}
                  onChange={(e) => handleInputChange('national_fraternity', e.target.value)}
                  placeholder="e.g., Sigma Chi"
                  className={errors.national_fraternity ? 'border-red-500' : ''}
                />
                {errors.national_fraternity && <p className="text-sm text-red-500">{errors.national_fraternity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="university">University *</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="e.g., University of Mississippi"
                  className={errors.university ? 'border-red-500' : ''}
                />
                {errors.university && <p className="text-sm text-red-500">{errors.university}</p>}
              </div>
            </div>

            {/* School & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  placeholder="e.g., Ole Miss"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Oxford, Mississippi"
                  className={errors.location ? 'border-red-500' : ''}
                />
                {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
              </div>
            </div>

            {/* School Location */}
            <div className="space-y-2">
              <Label htmlFor="school_location">School Location</Label>
              <Input
                id="school_location"
                value={formData.school_location}
                onChange={(e) => handleInputChange('school_location', e.target.value)}
                placeholder="e.g., Oxford, MS"
              />
            </div>

            {/* Founded Year & Member Count */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded Year *</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => handleInputChange('founded_year', e.target.value)}
                  placeholder="e.g., 1855"
                  min="1800"
                  max={new Date().getFullYear()}
                  className={errors.founded_year ? 'border-red-500' : ''}
                />
                {errors.founded_year && <p className="text-sm text-red-500">{errors.founded_year}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="member_count">Member Count *</Label>
                <Input
                  id="member_count"
                  type="number"
                  value={formData.member_count}
                  onChange={(e) => handleInputChange('member_count', e.target.value)}
                  placeholder="e.g., 10"
                  min="0"
                  className={errors.member_count ? 'border-red-500' : ''}
                />
                {errors.member_count && <p className="text-sm text-red-500">{errors.member_count}</p>}
              </div>
            </div>

            {/* Chapter Status */}
            <div className="space-y-2">
                <Label htmlFor="chapter_status">Chapter Status</Label>
                <Select
                    value={formData.chapter_status}
                    onValueChange={(value) => handleInputChange('chapter_status', value)}
                >
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter a description of the chapter..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    <span>Update Chapter</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}