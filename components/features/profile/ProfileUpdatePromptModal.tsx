'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Briefcase, TrendingUp, UserRound, GraduationCap, Calculator, MapPin, Home } from 'lucide-react';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
    | 'hometown_change'
    | 'welcome_introduction';
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
    | 'hometown'
    | 'introduction';
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
  onUpdatePreferences?: (prefs: {
    dontShowAgain?: boolean;
    preferredTemplateType?: string;
  }) => void;
  isMobile?: boolean;
}

interface TemplateOption {
  id: string;
  content: string;
  label?: string;
}

// Priority order for change types (higher = more significant)
const CHANGE_PRIORITY: Record<DetectedChange['type'], number> = {
  'welcome_introduction': 11,
  'role_transition': 10,
  'member_status_change': 9,
  'company_change': 8,
  'career_update': 7,
  'location_change': 6,
  'industry_change': 5,
  'academic_update': 3,
  'major_change': 2,
  'minor_change': 2,
  'grad_year_change': 2,
  'gpa_change': 1,
  'hometown_change': 1,
};

// Helper: Check if a value is truly "new" (no oldValue or oldValue was empty/ignored)
function isNewValue(change: DetectedChange): boolean {
  return !change.oldValue || 
         change.oldValue === 'Not Specified' || 
         change.oldValue.trim() === '';
}

// Helper: Get the most significant change from multiple changes
function getPrimaryChange(changes: DetectedChange[]): DetectedChange | null {
  if (changes.length === 0) return null;
  if (changes.length === 1) return changes[0];
  
  // Sort by priority, then by order in array
  return [...changes].sort((a, b) => {
    const priorityDiff = (CHANGE_PRIORITY[b.type] || 0) - (CHANGE_PRIORITY[a.type] || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return 0; // Keep original order for ties
  })[0];
}

// Helper: Generate combined career template (handles company + title + industry together)
function generateCombinedCareerTemplate(changes: DetectedChange[]): string {
  const company = changes.find(c => c.field === 'company')?.newValue;
  const title = changes.find(c => c.field === 'job_title')?.newValue;
  const industry = changes.find(c => c.field === 'industry')?.newValue;
  
  const companyChange = changes.find(c => c.field === 'company');
  const titleChange = changes.find(c => c.field === 'job_title');
  const industryChange = changes.find(c => c.field === 'industry');
  
  const isNewCompany = companyChange ? isNewValue(companyChange) : false;
  const isNewTitle = titleChange ? isNewValue(titleChange) : false;
  const isNewIndustry = industryChange ? isNewValue(industryChange) : false;
  
  // All three changed = major career move
  if (company && title && industry && isNewCompany && isNewTitle && isNewIndustry) {
    return `Excited to share that I've joined ${company} as a ${title} in the ${industry} industry! This is a new chapter I'm really looking forward to. 🎉`;
  }
  
  // Company + Title (most common)
  if (company && title) {
    if (isNewCompany && isNewTitle) {
      return `Just started a new role as ${title} at ${company}!${industry ? ` Excited to be working in ${industry}.` : ''} 🚀`;
    } else if (isNewCompany) {
      return `Now working at ${company} as a ${title}!${industry ? ` Continuing in ${industry}.` : ''} 💼`;
    } else {
      return `Updated my role to ${title} at ${company}.${industry ? ` Still in ${industry}.` : ''} 📈`;
    }
  }
  
  // Company only
  if (company) {
    return isNewCompany 
      ? `Just joined ${company}!${title ? ` Excited to continue as ${title}.` : ''} 🎉`
      : `Updated my company to ${company}.${title ? ` Still serving as ${title}.` : ''} 💼`;
  }
  
  // Title only
  if (title) {
    return isNewTitle
      ? `Excited to share that I'm now a ${title}!${company ? ` at ${company}.` : ''} 🚀`
      : `Updated my title to ${title}.${company ? ` Still at ${company}.` : ''} 📈`;
  }
  
  // Industry only (be careful - don't say "transitioning" if just updating)
  if (industry) {
    return isNewIndustry
      ? `Transitioning to ${industry}! Looking forward to this new chapter. 📊`
      : `Updated my industry to ${industry}. Continuing to grow in this space! 💼`;
  }
  
  return 'Just updated my career information! 📈';
}

// Generate multiple template options for user to choose from
function generateTemplateOptions(changes: DetectedChange[]): TemplateOption[] {
  const primaryChange = getPrimaryChange(changes);
  if (!primaryChange) return [];
  
  const options: TemplateOption[] = [];
  
  // Handle welcome introduction first (highest priority)
  if (primaryChange.type === 'welcome_introduction') {
    const chapter = primaryChange.newValue || 'the chapter';
    options.push({
      id: 'excited',
      content: `Just joined ${chapter}! Would love to connect with new members. 👋`,
      label: 'Excited'
    });
    options.push({
      id: 'professional',
      content: `Hello ${chapter}! Looking forward to getting to know the community being a strong contributor.`,
      label: 'Professional'
    });
    options.push({
      id: 'brief',
      content: `I just joined the chapter and would love to connect with new members. 😊`,
      label: 'Brief'
    });
    return options;
  }
  
  // Handle combined career updates first
  const hasCareerFields = changes.some(c => 
    c.field === 'company' || c.field === 'job_title' || c.field === 'industry'
  );
  
  if (hasCareerFields && (primaryChange.type === 'career_update' || primaryChange.type === 'company_change')) {
    const company = changes.find(c => c.field === 'company')?.newValue;
    const title = changes.find(c => c.field === 'job_title')?.newValue;
    const industry = changes.find(c => c.field === 'industry')?.newValue;
    const companyChange = changes.find(c => c.field === 'company');
    const isNewCompany = companyChange ? isNewValue(companyChange) : false;
    
    if (company && title) {
      // Option 1: Casual
      options.push({
        id: 'casual',
        content: isNewCompany 
          ? `Just joined ${company} as a ${title}! 🎉`
          : `Now working at ${company} as a ${title}! 💼`,
        label: 'Casual'
      });
      
      // Option 2: Professional
      options.push({
        id: 'professional',
        content: isNewCompany
          ? `Excited to announce my new role as ${title} at ${company}!${industry ? ` Looking forward to contributing to the ${industry} industry.` : ''}`
          : `I'm now serving as ${title} at ${company}.${industry ? ` Continuing to work in ${industry}.` : ''}`,
        label: 'Professional'
      });
      
      // Option 3: Brief (only if new)
      if (isNewCompany) {
        options.push({
          id: 'brief',
          content: `New role: ${title} @ ${company} 🚀`,
          label: 'Brief'
        });
      }
    }
  }
  
  // Industry change
  else if (primaryChange.type === 'industry_change') {
    const isNew = isNewValue(primaryChange);
    options.push({
      id: 'transition',
      content: isNew
        ? `Transitioning to ${primaryChange.newValue}! Looking forward to this new chapter. 📊`
        : `Now working in ${primaryChange.newValue}. Excited to continue growing in this space! 💼`,
      label: isNew ? 'Transition' : 'Update'
    });
    options.push({
      id: 'casual',
      content: `Updated my industry to ${primaryChange.newValue}! 🎯`,
      label: 'Casual'
    });
  }
  
  // Location change
  else if (primaryChange.type === 'location_change') {
    const isNew = isNewValue(primaryChange);
    options.push({
      id: 'moved',
      content: isNew
        ? `Just moved to ${primaryChange.newValue}! 🗺️ Excited to explore this new city.`
        : `Updated my location to ${primaryChange.newValue}! 📍`,
      label: isNew ? 'Moved' : 'Updated'
    });
    options.push({
      id: 'brief',
      content: `Now in ${primaryChange.newValue}! 🏙️`,
      label: 'Brief'
    });
  }
  
  // Role transition
  else if (primaryChange.type === 'role_transition') {
    if (primaryChange.newValue === 'alumni') {
      options.push({
        id: 'excited',
        content: `Excited to announce I've graduated and joined the alumni network! 🎓✨`,
        label: 'Excited'
      });
      options.push({
        id: 'casual',
        content: `Just graduated and became an alum! 🎓`,
        label: 'Casual'
      });
    } else {
      options.push({
        id: 'default',
        content: generatePostTemplate(changes),
        label: 'Default'
      });
    }
  }
  
  // Academic updates
  else if (primaryChange.type === 'academic_update' || primaryChange.type === 'major_change') {
    const major = changes.find(c => c.field === 'major')?.newValue;
    const minor = changes.find(c => c.field === 'minor')?.newValue;
    
    if (major) {
      const isNew = isNewValue(changes.find(c => c.field === 'major')!);
      options.push({
        id: 'excited',
        content: isNew
          ? `Changed my major to ${major}!${minor ? ` Also added ${minor} as my minor!` : ''} Excited for this new academic path! 📖`
          : `Updated my major to ${major}.${minor ? ` Minor: ${minor}.` : ''} 📚`,
        label: isNew ? 'Excited' : 'Update'
      });
      options.push({
        id: 'brief',
        content: `New major: ${major}${minor ? ` + ${minor} minor` : ''}! 🎓`,
        label: 'Brief'
      });
    }
  }
  
  // Fallback: at least one option using the main template generator
  if (options.length === 0) {
    options.push({
      id: 'default',
      content: generatePostTemplate(changes),
      label: 'Default'
    });
  }
  
  return options;
}

// Template generator function (improved with context awareness)
function generatePostTemplate(changes: DetectedChange[]): string {
  if (changes.length === 0) return '';
  
  const primaryChange = getPrimaryChange(changes);
  if (!primaryChange) return 'Just updated my profile! 🎉';
  
  // Handle combined career updates first
  const hasCareerFields = changes.some(c => 
    c.field === 'company' || c.field === 'job_title' || c.field === 'industry'
  );
  
  if (hasCareerFields && (primaryChange.type === 'career_update' || primaryChange.type === 'company_change')) {
    return generateCombinedCareerTemplate(changes);
  }
  
  // Handle other change types with context awareness
  switch (primaryChange.type) {
    case 'industry_change': {
      const isNew = isNewValue(primaryChange);
      return isNew
        ? `Transitioning to ${primaryChange.newValue}! Looking forward to this new chapter. 📊`
        : `Updated my industry to ${primaryChange.newValue}. Continuing to grow in this space! 💼`;
    }
    
    case 'location_change': {
      const isNew = isNewValue(primaryChange);
      return isNew
        ? `Just moved to ${primaryChange.newValue}! 🗺️ Excited to explore this new city.`
        : `Updated my location to ${primaryChange.newValue}! 📍`;
    }
    
    case 'company_change': {
      const jobTitle = changes.find(c => c.field === 'job_title')?.newValue;
      const isNew = isNewValue(primaryChange);
      
      if (jobTitle && primaryChange.newValue) {
        return isNew
          ? `Just joined ${primaryChange.newValue} as a ${jobTitle}! 🎉`
          : `Now working at ${primaryChange.newValue} as a ${jobTitle}! 💼`;
      }
      return primaryChange.newValue 
        ? (isNew 
            ? `Excited to start a new role at ${primaryChange.newValue}! 🚀`
            : `Updated my company to ${primaryChange.newValue}. 💼`)
        : '';
    }
    
    case 'role_transition': {
      if (primaryChange.newValue === 'alumni') {
        return `Excited to announce I've graduated and joined the alumni network! 🎓✨`;
      }
      if (primaryChange.newValue === 'active_member') {
        return `I'm excited to be an active member this term and keep contributing to the chapter. 💙`;
      }
      return `Just updated my role to ${primaryChange.newValue}. Looking forward to what's next!`;
    }

    case 'member_status_change': {
      if (primaryChange.newValue === 'graduated') {
        return `I've officially graduated and transitioned to a new chapter beyond campus. 🎓`;
      }
      if (primaryChange.newValue === 'inactive') {
        return `My member status has changed, but I'm still grateful for my time with the chapter.`;
      }
      return `My member status is now ${primaryChange.newValue}.`;
    }
    
    case 'academic_update': {
      const major = changes.find(c => c.field === 'major')?.newValue;
      const minor = changes.find(c => c.field === 'minor')?.newValue;
      const gradYear = changes.find(c => c.field === 'grad_year')?.newValue;
      const gpa = changes.find(c => c.field === 'gpa')?.newValue;
      
      if (major && minor) {
        const majorChange = changes.find(c => c.field === 'major');
        const isNewMajor = majorChange ? isNewValue(majorChange) : false;
        return isNewMajor
          ? `Switched my major to ${major} with a minor in ${minor}! 📚`
          : `Updated my major to ${major} and minor to ${minor}. 📖`;
      }
      if (major) {
        const majorChange = changes.find(c => c.field === 'major');
        const isNewMajor = majorChange ? isNewValue(majorChange) : false;
        return isNewMajor
          ? `Changed my major to ${major}! Excited for this new academic path! 📖`
          : `Updated my major to ${major}. 📚`;
      }
      if (minor) {
        const minorChange = changes.find(c => c.field === 'minor');
        const isNewMinor = minorChange ? isNewValue(minorChange) : false;
        return isNewMinor
          ? `Added ${minor} as my minor! 🎓`
          : `Updated my minor to ${minor}. 📚`;
      }
      if (gradYear) {
        return `Updated my graduation year to ${gradYear}! Can't wait to graduate! 🎓`;
      }
      if (gpa) {
        return `Just updated my GPA to ${gpa}! 📊`;
      }
      return 'Just updated my academic information! 📚';
    }
    
    case 'major_change': {
      const isNew = isNewValue(primaryChange);
      return primaryChange.newValue 
        ? (isNew
            ? `Changed my major to ${primaryChange.newValue}! Excited for this new academic path! 📖`
            : `Updated my major to ${primaryChange.newValue}. 📚`)
        : '';
    }
    
    case 'minor_change': {
      const isNew = isNewValue(primaryChange);
      return primaryChange.newValue
        ? (isNew
            ? `Added ${primaryChange.newValue} as my minor! 🎓`
            : `Updated my minor to ${primaryChange.newValue}. 📚`)
        : '';
    }
    
    case 'grad_year_change': {
      return primaryChange.newValue
        ? `Updated my graduation year to ${primaryChange.newValue}! Can't wait to graduate! 🎓`
        : '';
    }
    
    case 'gpa_change': {
      return primaryChange.newValue
        ? `Just updated my GPA to ${primaryChange.newValue}! 📊`
        : '';
    }
    
    case 'hometown_change': {
      const isNew = isNewValue(primaryChange);
      return primaryChange.newValue
        ? (isNew
            ? `Updated my hometown to ${primaryChange.newValue}! 🏠`
            : `My hometown is ${primaryChange.newValue}. 🏡`)
        : '';
    }
    
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
  initialTemplate,
  onUpdatePreferences,
  isMobile,
}: ProfileUpdatePromptModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [preferredTemplateType, setPreferredTemplateType] = useState<string | undefined>(undefined);
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate and set initial template when modal opens
  useEffect(() => {
    if (isOpen && detectedChanges.length > 0) {
      // Generate template options
      const options = generateTemplateOptions(detectedChanges);
      setTemplateOptions(options);
      
      // Use initial template if provided, otherwise use first option
      const template = initialTemplate || (options.length > 0 ? options[0].content : generatePostTemplate(detectedChanges));
      setContent(template);
      setSelectedTemplateId(options.length > 0 ? options[0].id : 'default');
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
      setDontShowAgain(false);
      setPreferredTemplateType(undefined);
      setTemplateOptions([]);
      setSelectedTemplateId('default');
    }
  }, [isOpen]);

  const persistPreferences = () => {
    if (!onUpdatePreferences) return;
    onUpdatePreferences({
      dontShowAgain,
      preferredTemplateType,
    });
  };

  const handlePost = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Please enter some content before posting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Persist any preference changes when user posts
      persistPreferences();
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
    // Persist any preference changes when user skips
    persistPreferences();
    onSkip();
    onClose();
  };

  const primaryChange = getPrimaryChange(detectedChanges);
  const hasMultipleChanges = detectedChanges.length > 1;

  const contentBody = (
    <>
      {/* Fixed Header + User Info */}
      <div className="shrink-0 p-6 sm:p-8 pb-4 sm:pb-4 border-b border-slate-200/50">
        <div className="flex flex-row items-start justify-between pb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100/70 flex items-center justify-center text-brand-primary-hover">
                {primaryChange ? getChangeIcon(primaryChange.type) : <Sparkles className="h-5 w-5" />}
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Share your update?
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Let your chapter know about your profile changes
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 sm:px-8 py-4 sm:py-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-primary-100/70 rounded-full flex items-center justify-center text-brand-primary-hover text-sm font-semibold shrink-0 overflow-hidden ring-2 ring-white">
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

          <Card className="border-slate-200/80 bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Preview:</p>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {content || 'Your post will appear here...'}
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="post-content" className="block text-sm font-medium text-slate-700">
                Edit your post
              </label>
              {templateOptions.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {templateOptions.map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant={selectedTemplateId === option.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedTemplateId(option.id);
                        setContent(option.content);
                        setError(null);
                      }}
                      className="h-7 px-2.5 text-xs rounded-full"
                    >
                      {option.label || option.id}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            <Textarea
              ref={textareaRef}
              id="post-content"
              placeholder="What do you want to share?"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setError(null);
              }}
              className="min-h-[120px] sm:min-h-[100px] resize-none rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-base sm:text-lg text-slate-800 placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200 transition"
            />
            <p className="text-xs text-slate-500 mt-2">{content.length} characters</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="shrink-0 border-t border-slate-200/70 bg-slate-50/70 p-4 sm:p-3 shadow-inner">
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            <span>Don&apos;t show this profile update prompt again</span>
          </label>

          <div className="flex flex-row flex-wrap items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 min-w-[120px] h-11 sm:h-10 rounded-full border border-slate-200 bg-white/90 px-6 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </Button>
            <Button
              onClick={handlePost}
              disabled={!content.trim() || isSubmitting}
              className="flex-1 min-w-[120px] h-12 sm:h-10 rounded-full bg-brand-primary px-8 text-sm font-semibold tracking-wide text-white shadow-[0_18px_45px_-24px_rgba(30,64,175,0.9)] transition-all duration-200 hover:bg-brand-primary-hover hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-28px_rgba(30,64,175,0.85)] disabled:translate-y-0 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // Mobile: bottom drawer
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[90vh] rounded-t-3xl rounded-b-none p-0 flex flex-col border border-slate-200/80 bg-white/95 shadow-[0_-24px_80px_rgba(15,23,42,0.6)]"
        >
          {contentBody}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: existing dialog
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[600px] max-w-[85vw] max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-[0_28px_90px_-40px_rgba(15,23,42,0.55)] sm:rounded-3xl rounded-2xl p-0 flex flex-col"
      >
        {contentBody}
      </DialogContent>
    </Dialog>
  );
}


