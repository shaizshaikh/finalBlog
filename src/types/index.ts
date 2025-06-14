
export interface Article {
  id: string; // UUID from database
  title: string;
  content: string; // Markdown content
  slug: string; // Should be unique
  tags: string[]; // Stored as TEXT[] in PostgreSQL
  created_at: string; // ISO date string (TIMESTAMPTZ from DB)
  author: string;
  image_url?: string | null; // Nullable in DB
  likes: number;
  excerpt?: string | null; // Nullable in DB
  data_ai_hint?: string | null; // Nullable in DB
}

export interface PaginatedArticles {
  articles: Article[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  content: string;
  created_at: string; // ISO date string
  is_approved: boolean;
  likes: number;
  dislikes: number;
}

export interface PaginatedComments {
  comments: Comment[];
  totalCount: number;
}

// For subscribers table
export interface Subscriber {
  email: string;
  is_active: boolean;
  subscribed_at: string; // ISO date string
  unsubscribed_at?: string | null; // ISO date string, nullable
}
