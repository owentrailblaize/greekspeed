import { ChapterMemberData } from '@/types/chapter';
import { calculateProfileCompleteness } from './profileCompleteness';
import { Profile } from '@/types/profile';

/**
 * Calculate activity priority score (lower number = higher priority)
 */
function getActivityPriority(lastActiveAt?: string | null): number {
  if (!lastActiveAt) return 4; // No activity - lowest priority
  
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  if (lastActive >= oneHourAgo) return 1; // Active within 1 hour - highest priority
  if (lastActive >= oneDayAgo) return 2; // Active within 24 hours - high priority
  if (lastActive >= oneWeekAgo) return 3; // Active within week - medium priority
  return 4; // Older than week - low priority
}

/**
 * Check if avatar URL is valid and not empty
 */
function hasValidAvatar(avatarUrl: string | null | undefined): boolean {
    return !!(avatarUrl && avatarUrl.trim() !== '');
}

/**
 * Calculate combined priority score for Networking Spotlight
 * Higher score = more likely to appear first
 */
export function calculateNetworkingPriority(member: ChapterMemberData): number {
  // 1. Profile completeness (0-100, weighted 60%)
  const profileData: Profile = {
    id: member.id,
    email: member.email,
    full_name: member.full_name,
    first_name: member.first_name,
    last_name: member.last_name,
    chapter: member.chapter,
    chapter_id: member.chapter_id,
    role: member.role as any,
    chapter_role: member.chapter_role,
    member_status: member.member_status,
    grad_year: member.grad_year,
    major: member.major,
    minor: member.minor,
    gpa: member.gpa,
    hometown: member.hometown,
    bio: member.bio,
    phone: member.phone,
    location: member.location,
    avatar_url: member.avatar_url,
    created_at: member.created_at,
    updated_at: member.updated_at,
    sms_consent: false, // Default value, not used in completeness calculation
    pledge_class: member.pledge_class
  };
  
  const completeness = calculateProfileCompleteness(profileData);
  const completenessScore = completeness.percentage; // 0-100
  
  // 2. Activity priority (1-4, convert to 0-100 scale, weighted 40%)
  const activityPriority = getActivityPriority(member.lastActiveAt);
  const activityScore = ((5 - activityPriority) / 4) * 100; // Invert: 1->100, 4->25
  
    
  // 3. Avatar bonus - heavily prioritize users with avatars
  // This adds a significant boost (40 points) to users with avatars
  const avatarBonus = hasValidAvatar(member.avatar_url) ? 40 : 0;
  
  // 4. Combined weighted score with avatar bonus
  // Base score: completeness (60%) + activity (40%)
  // Then add avatar bonus directly
  const baseScore = (completenessScore * 0.6) + (activityScore * 0.4);
  const combinedScore = baseScore + avatarBonus;
  
  // Cap at 100 to keep scores in reasonable range
  return Math.min(combinedScore, 100);
}