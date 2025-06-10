
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
