export interface Post {
  id: string;
  chapter_id: string;
  author_id: string;
  content: string;
  post_type: 'text' | 'image' | 'text_image';
  image_url?: string;
  metadata?: Record<string, any>;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  // New fields for announcement integration
  is_announcement?: boolean;
  announcement_id?: string;
  is_pinned?: boolean;
  pinned_until?: string;
  author?: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  is_author?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

export interface CreatePostRequest {
  content: string;
  post_type: 'text' | 'image' | 'text_image';
  image_url?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePostRequest {
  content?: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentsResponse {
  comments: PostComment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
