// API Configuration and Types for Lumen Blog

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  role: 'admin' | 'editor' | 'author' | 'subscriber' | 'reader';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Token Types
export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Post Types
export interface Author {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  content?: Record<string, unknown>;
  meta_description?: string;
  featured_image?: string;
  read_time: number;
  view_count: number;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  is_member_only: boolean;
  author: Author;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface PostCreate {
  title: string;
  subtitle?: string;
  content?: Record<string, unknown>;
  meta_description?: string;
  featured_image?: string;
  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  is_member_only?: boolean;
}

export interface PostsPage {
  items: Post[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// File Upload Types
export interface FileUpload {
  file_url: string;
  file_key: string;
  content_type: string;
  size: number;
  category: string;
  filename: string;
}

// Comment Types
export interface CommentAuthor {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  post_id: string;
  parent_id?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  reply_count: number;
}

export interface CommentCreate {
  content: string;
  parent_id?: string;
}

// Interaction Types
export interface LikeResponse {
  id: string;
  post_id: string;
  user_id: string;
  clap_count: number;
}

export interface LikeCreate {
  clap_count: number;
}

export interface PostLikeStats {
  total_likes: number;
  total_claps: number;
  user_liked: boolean;
  user_claps: number;
}

export interface BookmarkResponse {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
  post?: Post;
}

export interface BookmarkStatus {
  is_bookmarked: boolean;
}

export interface FollowResponse {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface FollowStatus {
  is_following: boolean;
}

export interface UserFollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

// API Error Type
export interface ApiError {
  detail: string;
}
