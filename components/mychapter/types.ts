export interface ChapterMember {
  id: string;
  name: string;
  year: string;
  major: string;
  position?: string;
  interests: string[];
  avatar?: string;
  // New fields for LinkedIn-style cards
  verified?: boolean;
  mutualConnections?: MutualConnection[];
  mutualConnectionsCount?: number;
  description?: string;
}

export interface MutualConnection {
  name: string;
  avatar?: string;
}

export interface ChapterStats {
  totalMembers: number;
  activeMembers: number;
  officers: number;
  events: number;
  committees: number;
  alumniConnections: number;
} 