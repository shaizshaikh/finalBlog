export interface Article {
  id: string;
  title: string;
  content: string; // Markdown content
  slug: string;
  tags: string[];
  createdAt: string; // ISO date string
  author: string;
  imageUrl?: string; // Placeholder image URL
  likes: number;
  excerpt?: string; // Short summary for cards
}
