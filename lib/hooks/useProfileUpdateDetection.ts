'use client';

import { useRef, useCallback } from 'react';
import type { DetectedChange } from '@/components/features/profile/ProfileUpdatePromptModal';

interface ProfileState {
  // Profile table fields
  role?: string | null;
  /**
   * Member status field (e.g., active, graduated, inactive)
   * This is typically controlled by admins, not end-users.
   */
  member_status?: string | null;
  
  // Alumni table fields (for alumni users)
  job_title?: string | null;
  company?: string | null;
  industry?: string | null;
  
  // Active member fields (for active members)
  major?: string | null;
  minor?: string | null;
  grad_year?: string | number | null;
  gpa?: string | number | null;
  location?: string | null;
  hometown?: string | null;
}

interface UseProfileUpdateDetectionOptions {
  /**
   * Initial profile state - should be set when modal opens
   */
  initialProfile?: ProfileState;
  /**
   * Whether to ignore "Not Specified" values as changes
   * @default true
   */
  ignoreNotSpecified?: boolean;
}

interface ProfileUpdateDetectionResult {
  /**
   * Detects changes between previous and current state
   * @param currentProfile - Current profile state after update
   * @returns Array of detected changes, empty if none
   */
  detectChanges: (currentProfile: ProfileState) => DetectedChange[];
  
  /**
   * Sets the baseline profile state (call when modal opens)
   * @param profile - Profile state to use as baseline
   */
  setBaseline: (profile: ProfileState) => void;
  
  /**
   * Clears the stored baseline state
   */
  clearBaseline: () => void;
  
  /**
   * Gets the current baseline state
   */
  getBaseline: () => ProfileState | null;
}

/**
 * Hook to detect profile updates that should trigger a post prompt.
 * 
 * Tracks career-related changes (job_title, company, industry) and role transitions.
 * 
 * @example
 * ```tsx
 * const { detectChanges, setBaseline } = useProfileUpdateDetection({
 *   initialProfile: { role: profile.role, ...alumniData }
 * });
 * 
 * // When modal opens, set baseline
 * useEffect(() => {
 *   if (profile && alumniData) {
 *     setBaseline({ role: profile.role, ...alumniData });
 *   }
 * }, [profile, alumniData, setBaseline]);
 * 
 * // After profile update, detect changes
 * const changes = detectChanges({ 
 *   role: updatedProfile.role, 
 *   ...updatedAlumniData 
 * });
 * ```
 */
export function useProfileUpdateDetection(
  options: UseProfileUpdateDetectionOptions = {}
): ProfileUpdateDetectionResult {
  const { ignoreNotSpecified = true } = options;
  
  // Store previous state in a ref (persists across renders)
  const baselineRef = useRef<ProfileState | null>(
    options.initialProfile || null
  );

  /**
   * Normalize a value - convert null/undefined to empty string, trim whitespace
   */
  const normalizeValue = useCallback((value: string | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }, []);

  /**
   * Check if a value should be ignored (Not Specified, empty, etc.)
   */
  const shouldIgnoreValue = useCallback((value: string): boolean => {
    if (!ignoreNotSpecified) return false;
    const normalized = normalizeValue(value).toLowerCase();
    return (
      normalized === '' ||
      normalized === 'not specified' ||
      normalized === 'not set' ||
      normalized === 'none'
    );
  }, [ignoreNotSpecified, normalizeValue]);

  /**
   * Check if a value has meaningfully changed
   */
  const hasChanged = useCallback((
    oldValue: string | null | undefined,
    newValue: string | null | undefined
  ): boolean => {
    const oldNorm = normalizeValue(oldValue);
    const newNorm = normalizeValue(newValue);

    // Both empty/ignored = no change
    if (shouldIgnoreValue(oldNorm) && shouldIgnoreValue(newNorm)) {
      return false;
    }

    // If old is ignored but new is not = change (new meaningful value added)
    if (shouldIgnoreValue(oldNorm) && !shouldIgnoreValue(newNorm)) {
      return true;
    }

    // If old is not ignored but new is = change (value removed/cleared)
    if (!shouldIgnoreValue(oldNorm) && shouldIgnoreValue(newNorm)) {
      return true;
    }

    // Both have values - check if different
    return oldNorm !== newNorm;
  }, [normalizeValue, shouldIgnoreValue]);

  /**
   * Detect all changes between baseline and current state
   */
  const detectChanges = useCallback((currentProfile: ProfileState): DetectedChange[] => {
    const baseline = baselineRef.current;
    if (!baseline) {
      // No baseline set, can't detect changes
      return [];
    }

    const changes: DetectedChange[] = [];

    // Check role transition (active_member → alumni, etc.)
    const oldRole = normalizeValue(baseline.role);
    const newRole = normalizeValue(currentProfile.role);
    
    if (hasChanged(oldRole, newRole) && !shouldIgnoreValue(newRole)) {
      changes.push({
        type: 'role_transition',
        field: 'role',
        oldValue: oldRole || undefined,
        newValue: newRole,
      });
    }

    // Check member_status transitions (e.g., active → graduated)
    const oldStatus = normalizeValue(baseline.member_status);
    const newStatus = normalizeValue(currentProfile.member_status);

    if (hasChanged(oldStatus, newStatus) && !shouldIgnoreValue(newStatus)) {
      changes.push({
        type: 'member_status_change',
        field: 'member_status',
        oldValue: oldStatus || undefined,
        newValue: newStatus,
      });
    }

    // Check career fields (alumni-specific)
    const careerFields = [
      { key: 'job_title' as const, changeType: 'career_update' as const },
      { key: 'company' as const, changeType: 'company_change' as const },
      { key: 'industry' as const, changeType: 'industry_change' as const },
    ] as const;

    for (const { key, changeType } of careerFields) {
      const oldValue = normalizeValue(baseline[key]);
      const newValue = normalizeValue(currentProfile[key]);

      if (hasChanged(oldValue, newValue)) {
        // For company changes, determine if it's a company_change or career_update
        let finalChangeType: DetectedChange['type'] = changeType;
        
        // If multiple career fields changed, prioritize career_update
        if (changeType === 'company_change' && changes.some(c => c.type === 'career_update')) {
          finalChangeType = 'career_update';
        } else if (key === 'job_title' && changes.some(c => c.field === 'company')) {
          // If job_title changed and company also changed, make both career_update
          const companyChangeIndex = changes.findIndex(c => c.field === 'company');
          if (companyChangeIndex >= 0) {
            changes[companyChangeIndex].type = 'career_update';
          }
          finalChangeType = 'career_update';
        }

        changes.push({
          type: finalChangeType,
          field: key,
          oldValue: !shouldIgnoreValue(oldValue) ? oldValue : undefined,
          newValue: newValue,
        });
      }
    }

    // If multiple career fields changed together, consolidate to career_update
    const careerFieldsChanged = changes.filter(
      c => c.field === 'job_title' || c.field === 'company' || c.field === 'industry'
    );

    if (careerFieldsChanged.length > 1) {
      // Consolidate all to career_update
      changes.forEach(change => {
        if (change.field === 'job_title' || change.field === 'company' || change.field === 'industry') {
          change.type = 'career_update';
        }
      });
    }

    // Check active member fields (academic/profile fields)
    const activeMemberFields = [
      { key: 'major' as const, changeType: 'major_change' as const },
      { key: 'minor' as const, changeType: 'minor_change' as const },
      { key: 'grad_year' as const, changeType: 'grad_year_change' as const },
      { key: 'gpa' as const, changeType: 'gpa_change' as const },
      { key: 'location' as const, changeType: 'location_change' as const },
      { key: 'hometown' as const, changeType: 'hometown_change' as const },
    ] as const;

    for (const { key, changeType } of activeMemberFields) {
      // Normalize grad_year and gpa to strings for comparison
      const oldValue = key === 'grad_year' || key === 'gpa' 
        ? normalizeValue(baseline[key]?.toString())
        : normalizeValue(baseline[key]);
      const newValue = key === 'grad_year' || key === 'gpa'
        ? normalizeValue(currentProfile[key]?.toString())
        : normalizeValue(currentProfile[key]);

      if (hasChanged(oldValue, newValue)) {
        changes.push({
          type: changeType,
          field: key,
          oldValue: !shouldIgnoreValue(oldValue) ? oldValue : undefined,
          newValue: newValue,
        });
      }
    }

    // If multiple academic fields changed together, consolidate to academic_update
    const academicFieldsChanged = changes.filter(
      c => c.field === 'major' || c.field === 'minor' || c.field === 'grad_year' || c.field === 'gpa'
    );

    if (academicFieldsChanged.length > 1) {
      // Consolidate all to academic_update
      changes.forEach(change => {
        if (change.field === 'major' || change.field === 'minor' || change.field === 'grad_year' || change.field === 'gpa') {
          change.type = 'academic_update';
        }
      });
    }

    return changes;
  }, [normalizeValue, hasChanged, shouldIgnoreValue]);

  /**
   * Set the baseline profile state (call when modal opens or profile loads)
   */
  const setBaseline = useCallback((profile: ProfileState) => {
    baselineRef.current = { ...profile };
  }, []);

  /**
   * Clear the baseline state
   */
  const clearBaseline = useCallback(() => {
    baselineRef.current = null;
  }, []);

  /**
   * Get current baseline state
   */
  const getBaseline = useCallback((): ProfileState | null => {
    return baselineRef.current ? { ...baselineRef.current } : null;
  }, []);

  return {
    detectChanges,
    setBaseline,
    clearBaseline,
    getBaseline,
  };
}


