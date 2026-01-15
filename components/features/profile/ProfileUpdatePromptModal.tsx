'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Briefcase, TrendingUp, UserRound, GraduationCap, Calculator, MapPin, Home } from 'lucide-react';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { Card, CardContent } from '@/components/ui/card';

export interface DetectedChange {
  type:
    | 'career_update'
    | 'role_transition'
    | 'member_status_change'
    | 'company_change'
    | 'industry_change'
    | 'academic_update'
    | 'major_change'
    | 'minor_change'
    | 'grad_year_change'
    | 'gpa_change'
    | 'location_change'
    | 'hometown_change';
  oldValue?: string;
  newValue: string;
  field:
    | 'job_title'
    | 'company'
    | 'industry'
    | 'role'
    | 'member_status'
    | 'major'
    | 'minor'
    | 'grad_year'
    | 'gpa'
    | 'location'
    | 'hometown';
}

interface ProfileUpdatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (content: string) => Promise<void>;
  onSkip: () => void;
  detectedChanges: DetectedChange[];
  userProfile: {
    full_name: string;
    avatar_url?: string | null;
    chapter?: string | null;
  };
  initialTemplate?: string;
}

// Template generator function
function generatePostTemplate(changes: DetectedChange[]): string {
  if (changes.length === 0) return '';
  
  const change = changes[0]; // Primary change (we'll enhance this later)
  
  switch (change.type) {
    case 'company_change':
      const jobTitle = changes.find(c => c.field === 'job_title')?.newValue;
      if (jobTitle && change.newValue) {
        return `Just joined ${change.newValue} as a ${jobTitle}! 🎉`;
      }
      return change.newValue ? `Excited to start a new role at ${change.newValue}! 🚀` : '';
    
    case 'career_update':
      const company = changes.find(c => c.field === 'company')?.newValue;
      const title = changes.find(c => c.field === 'job_title')?.newValue;
      if (company && title) {
        return `Just joined ${company} as a ${title}! 🎉`;
      }
      if (title) {
        return `Excited to share that I'm now a ${title}! 🚀`;
      }
      return 'Just updated my career information! 📈';
    
    case 'industry_change':
      return change.newValue 
        ? `Transitioning to ${change.newValue}! Looking forward to this new chapter. 📊`
        : '';
    
    case 'role_transition':
      if (change.newValue === 'alumni') {
        return `Excited to announce I've graduated and joined the alumni network! 🎓✨`;
      }
      if (change.newValue === 'active_member') {
        return `I'm excited to be an active member this term and keep contributing to the chapter. 💙`;
      }
      return `Just updated my role to ${change.newValue}. Looking forward to what's next!`;

    case 'member_status_change':
      if (change.newValue === 'graduated') {
        return `I've officially graduated and transitioned to a new chapter beyond campus. 🎓`;
      }
      if (change.newValue === 'inactive') {
        return `My member status has changed, but I'm still grateful for my time with the chapter.`;
      }
      return `My member status is now ${change.newValue}.`;
    
    case 'academic_update':
      const major = changes.find(c => c.field === 'major')?.newValue;
      const minor = changes.find(c => c.field === 'minor')?.newValue;
      const gradYear = changes.find(c => c.field === 'grad_year')?.newValue;
      const gpa = changes.find(c => c.field === 'gpa')?.newValue;
      
      if (major && minor) {
        return `Switched my major to ${major} with a minor in ${minor}! 📚`;
      }
      if (major) {
        return `Changed my major to ${major}! Excited for this new academic path! 📖`;
      }
      if (minor) {
        return `Added ${minor} as my minor! 🎓`;
      }
      if (gradYear) {
        return `Updated my graduation year to ${gradYear}! Can't wait to graduate! 🎓`;
      }
      if (gpa) {
        return `Just updated my GPA to ${gpa}! 📊`;
      }
      return 'Just updated my academic information! 📚';
    
    case 'major_change':
      return change.newValue 
        ? `Changed my major to ${change.newValue}! Excited for this new academic path! 📖`
        : '';
    
    case 'minor_change':
      return change.newValue
        ? `Added ${change.newValue} as my minor! 🎓`
        : '';
    
    case 'grad_year_change':
      return change.newValue
        ? `Updated my graduation year to ${change.newValue}! Can't wait to graduate! 🎓`
        : '';
    
    case 'gpa_change':
      return change.newValue
        ? `Just updated my GPA to ${change.newValue}! 📊`
        : '';
    
    case 'location_change':
      return change.newValue
        ? `Moved to ${change.newValue}! 🗺️`
        : '';
    
    case 'hometown_change':
      return change.newValue
        ? `Updated my hometown to ${change.newValue}! 🏠`
        : '';
    
    default:
      return 'Just updated my profile! 🎉';
  }
}

// Change icon mapper
function getChangeIcon(type: DetectedChange['type']) {
  switch (type) {
    case 'company_change':
    case 'career_update':
      return <Briefcase className="h-5 w-5" />;
    case 'industry_change':
      return <TrendingUp className="h-5 w-5" />;
    case 'role_transition':
    case 'member_status_change':
      return <UserRound className="h-5 w-5" />;
    case 'academic_update':
    case 'major_change':
    case 'minor_change':
    case 'grad_year_change':
    case 'gpa_change':
      return <GraduationCap className="h-5 w-5" />;
    case 'location_change':
      return <MapPin className="h-5 w-5" />;
    case 'hometown_change':
      return <Home className="h-5 w-5" />;
    default:
      return <Sparkles className="h-5 w-5" />;
  }
}

export function ProfileUpdatePromptModal({
  isOpen,
  onClose,
  onPost,
  onSkip,
  detectedChanges,
  userProfile,
  initialTemplate
}: ProfileUpdatePromptModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate and set initial template when modal opens
  useEffect(() => {
    if (isOpen && detectedChanges.length > 0) {
      const template = initialTemplate || generatePostTemplate(detectedChanges);
      setContent(template);
      setError(null);
      
      // Auto-focus textarea after a brief delay
      setTimeout(() => {
        textareaRef.current?.focus();
        // Place cursor at end
        const length = template.length;
        textareaRef.current?.setSelectionRange(length, length);
      }, 100);
    }
  }, [isOpen, detectedChanges, initialTemplate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handlePost = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Please enter some content before posting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onPost(trimmedContent);
      // Modal will close via parent component after successful post
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  const primaryChange = detectedChanges[0];
  const hasMultipleChanges = detectedChanges.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 flex flex-col"
      >
        {/* Fixed Header */}
        <div className="shrink-0 p-6 sm:p-8 pb-4 sm:pb-4 border-b border-slate-200/50">
          <DialogHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-navy-100/70 flex items-center justify-center text-navy-700">
                  {primaryChange ? getChangeIcon(primaryChange.type) : <Sparkles className="h-5 w-5" />}
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900">
                  Share your update?
                </DialogTitle>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Let your chapter know about your profile changes
              </p>
            </div>
          </DialogHeader>

          {/* User Info Badge */}
          <div className="flex items-start gap-3 mt-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-navy-100/70 rounded-full flex items-center justify-center text-navy-700 text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
              {userProfile.avatar_url ? (
                <ImageWithFallback 
                  src={userProfile.avatar_url} 
                  alt={userProfile.full_name || 'User'} 
                  width={44} 
                  height={44} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                userProfile.full_name?.charAt(0) || 'U'
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">{userProfile.full_name || 'You'}</p>
              <Badge className="mt-2 inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-600">
                Post to {userProfile.chapter || 'Chapter'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 py-4 sm:py-6">
          <div className="space-y-4">
            {/* Change Summary Card (if multiple changes) */}
            {hasMultipleChanges && (
              <Card className="border-slate-200/80 bg-slate-50/50">
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-slate-600 mb-2">Look Like You've Updated Your Profile:</p>
                  <ul className="space-y-1.5">
                    {detectedChanges.map((change, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <span className="text-slate-400">•</span>
                        <span className="capitalize">{change.field.replace('_', ' ')}</span>
                        {change.oldValue && change.oldValue !== 'Not Specified' && (
                          <>
                            <span className="text-slate-400">→</span>
                            <span className="text-slate-500 line-through">{change.oldValue}</span>
                          </>
                        )}
                        <span className="text-slate-400">→</span>
                        <span className="font-medium text-slate-900">{change.newValue}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Preview Card */}
            <Card className="border-slate-200/80 bg-white">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-600 mb-2">Preview:</p>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {content || 'Your post will appear here...'}
                </div>
              </CardContent>
            </Card>

            {/* Editable Textarea */}
            <div>
              <label htmlFor="post-content" className="block text-sm font-medium text-slate-700 mb-2">
                Edit your post
              </label>
              <Textarea
                ref={textareaRef}
                id="post-content"
                placeholder="What do you want to share?"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setError(null);
                }}
                className="min-h-[120px] sm:min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:border-navy-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-200 transition"
              />
              <p className="text-xs text-slate-500 mt-2">
                {content.length} characters
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:p-3 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 sm:h-10 rounded-full border border-slate-200 bg-white/90 px-6 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </Button>
            <Button
              onClick={handlePost}
              disabled={!content.trim() || isSubmitting}
              className="w-full sm:w-auto h-12 sm:h-10 rounded-full bg-brand-primary px-8 text-sm font-semibold tracking-wide text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.9)] transition-all duration-200 hover:bg-brand-primary-hover hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-28px_rgba(30,64,175,0.85)] disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


