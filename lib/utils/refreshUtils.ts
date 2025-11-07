/**
 * Utility functions for refreshing page data without full page reloads
 * 
 * This module provides helper functions to refresh data using React state updates
 * instead of window.location.reload(), improving user experience and performance.
 * 
 * Usage Pattern:
 * - Use context refresh methods (refreshProfile, refreshConnections) when available
 * - Use hook refresh methods (fetchEvents, refetch, etc.) for specific data
 * - Use router.refresh() only for server-side data revalidation in Next.js
 * - Never use window.location.reload() for data refresh
 */

import { useRouter } from 'next/navigation';

/**
 * Refresh Next.js route data (server-side revalidation)
 * Use this only when you need to refresh server-side rendered data
 */
export function useRouteRefresh() {
  const router = useRouter();
  return () => router.refresh();
}

/**
 * Common refresh patterns documentation:
 * 
 * Profile: Use refreshProfile() from useProfile() hook
 * Connections: Use refreshConnections() from useConnections() hook
 * Events: Use fetchEvents() from useEvents() hook
 * Posts: Use refetch() from usePosts() hook
 * User Posts: Use fetchUserPosts() from useUserPosts() hook
 * Vendors: Use fetchVendors() from useVendors() hook
 * Messages: Use fetchMessages() from useMessages() hook
 * Tasks: Extract fetch logic to a function and call it directly
 */

