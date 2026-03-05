export type MetricType = 'total' | 'admin' | 'alumni' | 'active_member';

export interface UserGrowthStats {
  totalUsers: number;
  adminUsers: number;
  alumniUsers: number;
  activeMemberUsers: number;
  lastUpdated: string;
  // Previous period data for percentage change calculations
  previousPeriod?: {
    totalUsers: number;
    adminUsers: number;
    alumniUsers: number;
    activeMemberUsers: number;
  };
}

export interface UserGrowthChartData {
  date: string;
  total: number;
  admin: number;
  alumni: number;
  activeMember: number;
}

export interface UserGrowthFilters {
  chapterId?: string;
  startDate?: string;
  endDate?: string;
  activityWindow?: 7 | 30 | 90;
}

export interface UserListParams {
  metricType: MetricType;
  page?: number;
  limit?: number;
  chapterId?: string;
  startDate?: string;
  endDate?: string;
  activityWindow?: 7 | 30 | 90;
}

export interface UserListItem {
  id: string;
  full_name: string;
  email: string;
  chapter_id: string | null;
  chapter_name: string | null;
  role: string | null;
  chapter_role: string | null;
  member_status: string | null;
  created_at: string;
  last_active_at: string | null;
}

export interface UserListResponse {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
