export interface ChapterMember {
  id: string;
  name: string;
  year: string;
  major: string;
  position?: string;
  interests: string[];
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