export interface ChapterMember {
  id: string;
  name: string;
  year: string;
  major: string;
  position: string | undefined;
  interests?: string[]; // Make interests optional to match types/chapter.ts
  avatar?: string;
  verified: boolean;
  mutualConnections: Array<{
    name: string;
    avatar?: string;
  }>;
  mutualConnectionsCount: number;
  description: string;
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