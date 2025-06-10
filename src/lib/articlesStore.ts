'use server';

import type { Article } from '@/types';
import pool from '@/lib/db'; // Import the PostgreSQL pool

// Type for article data when creating (id, createdAt, likes are auto-generated or defaulted by DB)
type ArticleCreationData = Omit<Article, 'id' | 'createdAt' | 'likes'>;

export const getArticles = async (): Promise<Article[]> => {
  try {
    const result = await pool.query<Article>('SELECT * FROM articles ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching articles from DB:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const getArticleBySlug = async (slug: string): Promise<Article | undefined> => {
  try {
    const result = await pool.query<Article>('SELECT * FROM articles WHERE slug = $1', [slug]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error fetching article by slug ${slug} from DB:`, error);
    throw error;
  }
};

export const addArticle = async (articleData: ArticleCreationData): Promise<Article> => {
  const { title, content, slug, tags, author, imageUrl, excerpt, dataAiHint } = articleData;
  try {
    const result = await pool.query<Article>(
      `INSERT INTO articles (title, content, slug, tags, author, image_url, excerpt, data_ai_hint, likes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, content, slug, tags, author, imageUrl || null, excerpt || null, dataAiHint || null]
    );
    if (result.rows.length === 0) {
      throw new Error('Article creation failed, no rows returned.');
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error adding article to DB:', error);
    // Check for unique constraint violation on slug
    if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).constraint === 'articles_slug_key') {
      throw new Error(`An article with slug "${slug}" already exists.`);
    }
    throw error;
  }
};

export const updateArticle = async (updatedArticle: Article): Promise<Article | undefined> => {
  const { id, title, content, slug, tags, author, imageUrl, excerpt, dataAiHint, likes } = updatedArticle;
  try {
    const result = await pool.query<Article>(
      `UPDATE articles
       SET title = $1, content = $2, slug = $3, tags = $4, author = $5, image_url = $6, excerpt = $7, data_ai_hint = $8, likes = $9
       WHERE id = $10
       RETURNING *`,
      [title, content, slug, tags, author, imageUrl || null, excerpt || null, dataAiHint || null, likes, id]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating article ${id} in DB:`, error);
     if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).constraint === 'articles_slug_key') {
      throw new Error(`An article with slug "${slug}" already exists (and it's not this one).`);
    }
    throw error;
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    const result = await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      console.warn(`Attempted to delete article with id ${id}, but it was not found.`);
      // Optionally throw an error if an article must exist to be deleted
      // throw new Error(`Article with id ${id} not found.`);
    }
  } catch (error) {
    console.error(`Error deleting article ${id} from DB:`, error);
    throw error;
  }
};

export const likeArticleById = async (id: string): Promise<Article | undefined> => {
  try {
    const result = await pool.query<Article>(
      'UPDATE articles SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
        console.warn(`Article with id ${id} not found for liking.`);
        return undefined;
    }
    return result.rows[0];
  } catch (error) {
    console.error(`Error liking article ${id} in DB:`, error);
    throw error;
  }
};

// The old in-memory searchArticles function is removed as searching will primarily be
// done via AI on the frontend, which will receive all articles from getArticles().
// For more advanced DB-side searching, specific SQL queries or a search engine integration would be needed.
