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

// Check if user has developer permission based on access level
export function hasDeveloperPermission(
  userPermissions: DeveloperPermission[] | undefined,
  requiredPermission: DeveloperPermission
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}

// NEW: Check permission based on access level
export function hasDeveloperPermissionByAccessLevel(
  accessLevel: AccessLevel | undefined,
  requiredPermission: DeveloperPermission
): boolean {
  if (!accessLevel) return false;
  const levelPermissions = ACCESS_LEVEL_PERMISSIONS[accessLevel];
  return levelPermissions.includes(requiredPermission);
}

// Check if user can access developer portal
export function canAccessDeveloperPortal(profile: any): boolean {
  // Only users with role="developer" AND is_developer=true should have access
  return profile?.role === 'developer' && profile?.is_developer === true;
}

// Get developer access level
export function getDeveloperAccessLevel(profile: any): AccessLevel {
  return profile?.access_level || 'standard';
}

// Get permissions for a user based on their access level
export function getUserPermissions(profile: any): DeveloperPermission[] {
  if (!profile?.is_developer) return [];
  const accessLevel = (profile.access_level as AccessLevel) || 'standard';
  return ACCESS_LEVEL_PERMISSIONS[accessLevel];
}
