import { DeveloperPermission, AccessLevel } from '@/types/profile';

export const DEVELOPER_PERMISSIONS: Record<DeveloperPermission, string> = {
  view_users: 'View all users and profiles',
  view_analytics: 'View system analytics and metrics',
  create_endpoints: 'Create and manage API endpoints',
  manage_chapters: 'Create and manage chapters',
  manage_permissions: 'Manage user permissions and roles',
  view_system_health: 'View system health and performance',
  manage_onboarding: 'Manage user onboarding flows'
};

export const ACCESS_LEVEL_PERMISSIONS: Record<AccessLevel, DeveloperPermission[]> = {
  standard: ['view_users', 'view_analytics'],
  elevated: ['view_users', 'view_analytics', 'create_endpoints', 'manage_chapters'],
  admin: ['view_users', 'view_analytics', 'create_endpoints', 'manage_chapters', 'manage_permissions', 'view_system_health', 'manage_onboarding']
};

export function hasDeveloperPermission(
  userPermissions: DeveloperPermission[] | undefined,
  requiredPermission: DeveloperPermission
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}

export function canAccessDeveloperPortal(profile: any): boolean {
  return profile?.is_developer === true;
}

export function getDeveloperAccessLevel(profile: any): AccessLevel {
  return profile?.access_level || 'standard';
}
