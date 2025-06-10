
'use server';

import type { Article } from '@/types';
import pool from '@/lib/db'; // Import the PostgreSQL pool

// Type for article data when creating (id, createdAt, likes are auto-generated or defaulted by DB)
type ArticleCreationData = Omit<Article, 'id' | 'createdAt' | 'likes'>;

export const getArticles = async (): Promise<Article[]> => {
  console.log('articlesStore: Fetching all articles from DB');
  try {
    const result = await pool.query<Article>('SELECT * FROM articles ORDER BY created_at DESC');
    console.log(`articlesStore: Fetched ${result.rowCount} articles.`);
    return result.rows;
  } catch (error) {
    console.error('articlesStore: Error fetching articles from DB:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const getArticleBySlug = async (slug: string): Promise<Article | undefined> => {
  console.log(`articlesStore: Fetching article by slug "${slug}" from DB`);
  try {
    const result = await pool.query<Article>('SELECT * FROM articles WHERE slug = $1', [slug]);
    if (result.rows.length > 0) {
      console.log(`articlesStore: Found article with slug "${slug}".`);
    } else {
      console.log(`articlesStore: No article found with slug "${slug}".`);
    }
    return result.rows[0];
  } catch (error) {
    console.error(`articlesStore: Error fetching article by slug ${slug} from DB:`, error);
    throw error;
  }
};

export const addArticle = async (articleData: ArticleCreationData): Promise<Article> => {
  const { title, content, slug, tags, author, imageUrl, excerpt, dataAiHint } = articleData;
  console.log('articlesStore: Attempting to add article to DB with slug:', slug);
  console.log('articlesStore: Article data for insert:', JSON.stringify(articleData, null, 2));

  try {
    console.log('articlesStore: Executing INSERT query for article:', title);
    const result = await pool.query<Article>(
      `INSERT INTO articles (title, content, slug, tags, author, image_url, excerpt, data_ai_hint, likes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, content, slug, tags, author, imageUrl || null, excerpt || null, dataAiHint || null]
    );

    console.log('articlesStore: INSERT query result rowCount:', result.rowCount);
    console.log('articlesStore: INSERT query result.rows.length:', result.rows.length);

    if (result.rows.length === 0 || result.rowCount === 0) {
      console.error('articlesStore: Article creation failed, no rows returned or rowCount is 0.');
      throw new Error('Article creation failed, no rows returned from database.');
    }
    
    const insertedArticle = result.rows[0];
    console.log('articlesStore: Article supposedly inserted:', JSON.stringify(insertedArticle, null, 2));

    // Sanity check: try to select the article we just inserted by its ID
    console.log(`articlesStore: Performing sanity check for article ID ${insertedArticle.id}`);
    const sanityCheckResult = await pool.query<Article>('SELECT * FROM articles WHERE id = $1', [insertedArticle.id]);
    
    if (sanityCheckResult.rows.length === 0) {
      console.error(`articlesStore: CRITICAL SANITY CHECK FAILED! Article with ID ${insertedArticle.id} (title: ${insertedArticle.title}) was reported as inserted but NOT FOUND immediately after.`);
      throw new Error('Article creation reported success but data not found immediately. Possible database issue or transaction rollback.');
    }
    
    console.log(`articlesStore: Sanity check PASSED for article ID ${insertedArticle.id}. Article found immediately after insert.`);
    console.log('articlesStore: Sanity check found article:', JSON.stringify(sanityCheckResult.rows[0], null, 2));

    return sanityCheckResult.rows[0]; // Return the article confirmed by the sanity check
  } catch (error) {
    console.error('articlesStore: Error during addArticle process in DB:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).constraint === 'articles_slug_key') {
      console.error(`articlesStore: Unique constraint violation for slug "${slug}".`);
      throw new Error(`An article with slug "${slug}" already exists.`);
    }
    throw error; // Re-throw other errors
  }
};

export const updateArticle = async (updatedArticle: Article): Promise<Article | undefined> => {
  const { id, title, content, slug, tags, author, imageUrl, excerpt, dataAiHint, likes } = updatedArticle;
  console.log(`articlesStore: Attempting to update article ${id} in DB`);
  try {
    const result = await pool.query<Article>(
      `UPDATE articles
       SET title = $1, content = $2, slug = $3, tags = $4, author = $5, image_url = $6, excerpt = $7, data_ai_hint = $8, likes = $9
       WHERE id = $10
       RETURNING *`,
      [title, content, slug, tags, author, imageUrl || null, excerpt || null, dataAiHint || null, likes, id]
    );
    if (result.rows.length > 0) {
      console.log(`articlesStore: Successfully updated article ${id}.`);
    } else {
      console.warn(`articlesStore: Update for article ${id} affected 0 rows (article not found?).`);
    }
    return result.rows[0];
  } catch (error) {
    console.error(`articlesStore: Error updating article ${id} in DB:`, error);
     if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).constraint === 'articles_slug_key') {
      throw new Error(`An article with slug "${slug}" already exists (and it's not this one).`);
    }
    throw error;
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  console.log(`articlesStore: Attempting to delete article ${id} from DB`);
  try {
    const result = await pool.query('DELETE FROM articles WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      console.warn(`articlesStore: Attempted to delete article with id ${id}, but it was not found.`);
    } else {
      console.log(`articlesStore: Successfully deleted article ${id}.`);
    }
  } catch (error) {
    console.error(`articlesStore: Error deleting article ${id} from DB:`, error);
    throw error;
  }
};

export const likeArticleById = async (id: string): Promise<Article | undefined> => {
  console.log(`articlesStore: Attempting to like article ${id} in DB`);
  try {
    const result = await pool.query<Article>(
      'UPDATE articles SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
        console.warn(`articlesStore: Article with id ${id} not found for liking.`);
        return undefined;
    }
    console.log(`articlesStore: Successfully liked article ${id}. New likes: ${result.rows[0].likes}`);
    return result.rows[0];
  } catch (error) {
    console.error(`articlesStore: Error liking article ${id} in DB:`, error);
    throw error;
  }
};
