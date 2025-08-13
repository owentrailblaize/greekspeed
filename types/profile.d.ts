export interface Profile {
  id: string;
  email: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  chapter: string | null;
  role: "admin" | "alumni" | "active_member" | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  chapter: string;
  role?: 'admin' | 'alumni' | 'active_member'; // Made optional since not editable
  bio?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
}

export interface ProfileCompletion {
  totalFields: number;
  completedFields: number;
  percentage: number;
  missingFields: string[];
} 