'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Building2,
  User,
  AlertTriangle,
  ChevronLeft,
  CheckCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import {
  ParsedLinkedInData,
  ImportConfidence,
  ConfidenceLevel,
  ImportReviewFormData,
  importReviewFormSchema,
} from '@/types/profile-import';
import { industries, getGraduationYears } from '@/lib/alumniConstants';

// ============================================================================
// Props Interface
// ============================================================================

interface ImportReviewFormProps {
  /** The parsed data from the LinkedIn PDF */
  parsedData: ParsedLinkedInData;
  /** Confidence scores for each field */
  confidence?: ImportConfidence | null;
  /** Callback when user confirms the data */
  onConfirm: (data: ImportReviewFormData) => Promise<void>;
  /** Callback when user clicks back */
  onBack: () => void;
  /** Loading state during submission */
  isSubmitting?: boolean;
  /** Additional className */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the current/most recent experience from parsed data
 */
function getCurrentExperience(parsedData: ParsedLinkedInData) {
  if (!parsedData.experiences || parsedData.experiences.length === 0) {
    return null;
  }
  // Find current position, or use the first one (most recent)
  return parsedData.experiences.find(exp => exp.isCurrent) || parsedData.experiences[0];
}

/**
 * Get the most relevant education (typically first one)
 */
function getRelevantEducation(parsedData: ParsedLinkedInData) {
  if (!parsedData.education || parsedData.education.length === 0) {
    return null;
  }
  return parsedData.education[0];
}

/**
 * Determine border style based on confidence level
 */
function getConfidenceBorderClass(level?: ConfidenceLevel): string {
  switch (level) {
    case 'low':
      return 'border-amber-400 ring-1 ring-amber-200';
    case 'medium':
      return 'border-amber-300';
    case 'high':
    default:
      return 'border-gray-300';
  }
}

/**
 * Check if a field has low confidence
 */
function isLowConfidence(confidence: ImportConfidence | null | undefined, fieldPath: string): boolean {
  if (!confidence?.fields) return false;
  return confidence.fields[fieldPath] === 'low';
}

// ============================================================================
// Component
// ============================================================================

export function ImportReviewForm({
  parsedData,
  confidence,
  onConfirm,
  onBack,
  isSubmitting = false,
  className,
}: ImportReviewFormProps) {
  // Get graduation years for dropdown
  const graduationYears = useMemo(() => getGraduationYears(), []);

  // Get current experience and education from parsed data
  const currentExp = useMemo(() => getCurrentExperience(parsedData), [parsedData]);
  const education = useMemo(() => getRelevantEducation(parsedData), [parsedData]);

  // Form state - initialize from parsed data
  const [formData, setFormData] = useState<ImportReviewFormData>({
    fullName: parsedData.fullName || '',
    location: parsedData.location || currentExp?.location || '',
    industry: '', // User needs to select this
    currentExperience: {
      title: currentExp?.title || '',
      company: currentExp?.company || '',
      startMonth: currentExp?.startMonth?.toString() || '',
      startYear: currentExp?.startYear?.toString() || '',
      endMonth: currentExp?.endMonth?.toString() || '',
      endYear: currentExp?.endYear?.toString() || '',
      isCurrent: currentExp?.isCurrent ?? true,
      location: currentExp?.location || '',
      description: currentExp?.description || '',
    },
    education: {
      school: education?.school || '',
      degree: education?.degree || '',
      field: education?.field || '',
      graduationYear: education?.endYear?.toString() || '',
    },
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Handle input changes for top-level fields
   */
  const handleChange = useCallback((field: keyof ImportReviewFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  /**
   * Handle input changes for experience fields
   */
  const handleExperienceChange = useCallback((field: keyof ImportReviewFormData['currentExperience'], value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      currentExperience: { ...prev.currentExperience, [field]: value },
    }));
    // Clear error
    const errorKey = `currentExperience.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  }, [errors]);

  /**
   * Handle input changes for education fields
   */
  const handleEducationChange = useCallback((field: keyof ImportReviewFormData['education'], value: string) => {
    setFormData(prev => ({
      ...prev,
      education: { ...prev.education, [field]: value },
    }));
  }, []);

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    const result = importReviewFormSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await onConfirm(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save profile. Please try again.');
    }
  };

  /**
   * Render confidence indicator badge
   */
  const renderConfidenceIndicator = (fieldPath: string) => {
    const level = confidence?.fields?.[fieldPath];
    if (level !== 'low' && level !== 'medium') return null;

    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-2',
          level === 'low'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-yellow-50 text-yellow-700'
        )}
        title={level === 'low' ? 'This field may need review' : 'Please verify this field'}
      >
        <AlertTriangle className="h-3 w-3" />
        {level === 'low' ? 'Needs review' : 'Verify'}
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <Sparkles className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          Review Your Information
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          We've extracted this from your PDF. Please review and edit as needed.
        </p>
        {confidence?.overall === 'low' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Some fields may need your attention (highlighted in yellow)
            </p>
          </div>
        )}
      </div>

      {/* Personal Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-gray-400" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center">
              Full Name *
              {renderConfidenceIndicator('fullName')}
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className={cn(
                errors.fullName && 'border-red-500',
                isLowConfidence(confidence, 'fullName') && getConfidenceBorderClass('low')
              )}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              Location
              {renderConfidenceIndicator('location')}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
              className={cn(
                isLowConfidence(confidence, 'location') && getConfidenceBorderClass('low')
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Role Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-5 w-5 text-gray-400" />
            Current Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle" className="flex items-center">
              Job Title *
              {renderConfidenceIndicator('experiences.0.title')}
            </Label>
            <Input
              id="jobTitle"
              value={formData.currentExperience.title}
              onChange={(e) => handleExperienceChange('title', e.target.value)}
              placeholder="e.g., Product Manager"
              className={cn(
                errors['currentExperience.title'] && 'border-red-500',
                isLowConfidence(confidence, 'experiences.0.title') && getConfidenceBorderClass('low')
              )}
            />
            {errors['currentExperience.title'] && (
              <p className="text-sm text-red-500">{errors['currentExperience.title']}</p>
            )}
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center">
              <Building2 className="h-4 w-4 mr-1 text-gray-400" />
              Company *
              {renderConfidenceIndicator('experiences.0.company')}
            </Label>
            <Input
              id="company"
              value={formData.currentExperience.company}
              onChange={(e) => handleExperienceChange('company', e.target.value)}
              placeholder="e.g., Acme Corporation"
              className={cn(
                errors['currentExperience.company'] && 'border-red-500',
                isLowConfidence(confidence, 'experiences.0.company') && getConfidenceBorderClass('low')
              )}
            />
            {errors['currentExperience.company'] && (
              <p className="text-sm text-red-500">{errors['currentExperience.company']}</p>
            )}
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center">
              Industry *
              {renderConfidenceIndicator('industry')}
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => handleChange('industry', value)}
              placeholder="Select your industry"
              className={cn(
                errors.industry && '[&>button]:border-red-500',
                isLowConfidence(confidence, 'industry') && '[&>button]:border-amber-400'
              )}
            >
              <SelectItem value="">Select industry...</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </Select>
            {errors.industry && (
              <p className="text-sm text-red-500">{errors.industry}</p>
            )}
          </div>

          {/* Work Location (optional) */}
          <div className="space-y-2">
            <Label htmlFor="workLocation" className="flex items-center">
              Work Location
              {renderConfidenceIndicator('experiences.0.location')}
            </Label>
            <Input
              id="workLocation"
              value={formData.currentExperience.location}
              onChange={(e) => handleExperienceChange('location', e.target.value)}
              placeholder="e.g., New York, NY (or Remote)"
              className={cn(
                isLowConfidence(confidence, 'experiences.0.location') && getConfidenceBorderClass('low')
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-5 w-5 text-gray-400" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* School */}
          <div className="space-y-2">
            <Label htmlFor="school" className="flex items-center">
              School / University
              {renderConfidenceIndicator('education.0.school')}
            </Label>
            <Input
              id="school"
              value={formData.education.school}
              onChange={(e) => handleEducationChange('school', e.target.value)}
              placeholder="e.g., University of Mississippi"
              className={cn(
                isLowConfidence(confidence, 'education.0.school') && getConfidenceBorderClass('low')
              )}
            />
          </div>

          {/* Degree */}
          <div className="space-y-2">
            <Label htmlFor="degree" className="flex items-center">
              Degree
              {renderConfidenceIndicator('education.0.degree')}
            </Label>
            <Input
              id="degree"
              value={formData.education.degree}
              onChange={(e) => handleEducationChange('degree', e.target.value)}
              placeholder="e.g., Bachelor of Science"
              className={cn(
                isLowConfidence(confidence, 'education.0.degree') && getConfidenceBorderClass('low')
              )}
            />
          </div>

          {/* Field of Study */}
          <div className="space-y-2">
            <Label htmlFor="field">Field of Study</Label>
            <Input
              id="field"
              value={formData.education.field}
              onChange={(e) => handleEducationChange('field', e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>

          {/* Graduation Year */}
          <div className="space-y-2">
            <Label htmlFor="graduationYear" className="flex items-center">
              Graduation Year
              {renderConfidenceIndicator('education.0.endYear')}
            </Label>
            <Select
              value={formData.education.graduationYear}
              onValueChange={(value) => handleEducationChange('graduationYear', value)}
              placeholder="Select year"
              className={cn(
                isLowConfidence(confidence, 'education.0.endYear') && '[&>button]:border-amber-400'
              )}
            >
              <SelectItem value="">Select year...</SelectItem>
              {graduationYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 gap-2 bg-brand-primary hover:bg-brand-primary-hover"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Confirm & Continue
            </>
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-gray-400">
        You can update this information anytime in your profile settings
      </p>
    </form>
  );
}

export default ImportReviewForm;
