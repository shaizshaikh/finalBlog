
'use server';

import type { Article, PaginatedArticles as PaginatedArticlesType } from '@/types';
import pool from '@/lib/db'; 

// Type for article data when creating (id, createdAt, likes are auto-generated or defaulted by DB)
type ArticleCreationData = Omit<Article, 'id' | 'created_at' | 'likes'>;

export const getArticles = async (limit: number, offset: number): Promise<PaginatedArticlesType> => {
  console.log(`articlesStore: Fetching articles from DB with limit ${limit}, offset ${offset}`);
  try {
    const articlesQuery = 'SELECT * FROM articles ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const articlesResult = await pool.query<Article>(articlesQuery, [limit, offset]);

    const totalCountQuery = 'SELECT COUNT(*) FROM articles';
    const totalCountResult = await pool.query<{ count: string }>(totalCountQuery);
    const totalCount = parseInt(totalCountResult.rows[0].count, 10) || 0;
    
    console.log(`articlesStore: Fetched ${articlesResult.rowCount} articles. Total articles in DB: ${totalCount}.`);
    return {
      articles: articlesResult.rows,
      totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error('articlesStore: Error fetching articles from DB:', error);
    throw error; 
  }
};

export const getAllArticlesForSearch = async (): Promise<Article[]> => {
  console.log('articlesStore: Fetching ALL articles from DB for search purposes');
  try {
    const result = await pool.query<Article>('SELECT id, title, content, excerpt, tags FROM articles ORDER BY created_at DESC');
    console.log(`articlesStore: Fetched ${result.rowCount} articles for search.`);
    return result.rows;
  } catch (error) {
    console.error('articlesStore: Error fetching all articles for search from DB:', error);
    throw error;
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
  const { title, content, slug, tags, author, image_url, excerpt, data_ai_hint } = articleData;
  console.log('articlesStore: Attempting to add article to DB with slug:', slug);
  console.log('articlesStore: Article data for insert:', JSON.stringify(articleData, null, 2));

  try {
    console.log('articlesStore: Executing INSERT query for article:', title);
    const result = await pool.query<Article>(
      `INSERT INTO articles (title, content, slug, tags, author, image_url, excerpt, data_ai_hint, likes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, content, slug, tags, author, image_url || null, excerpt || null, data_ai_hint || null]
    );

    if (result.rows.length === 0 || result.rowCount === 0) {
      console.error('articlesStore: Article creation failed, no rows returned or rowCount is 0.');
      throw new Error('Article creation failed, no rows returned from database.');
    }
    
    const insertedArticle = result.rows[0];
    console.log('articlesStore: Article supposedly inserted:', JSON.stringify(insertedArticle, null, 2));
    
    const sanityCheckResult = await pool.query<Article>('SELECT * FROM articles WHERE id = $1', [insertedArticle.id]);
    
    if (sanityCheckResult.rows.length === 0) {
      console.error(`articlesStore: CRITICAL SANITY CHECK FAILED! Article with ID ${insertedArticle.id} was not found immediately after insert.`);
      throw new Error('Article creation reported success but data not found immediately.');
    }
    
    console.log(`articlesStore: Sanity check PASSED for article ID ${insertedArticle.id}.`);
    return sanityCheckResult.rows[0]; 
  } catch (error) {
    console.error('articlesStore: Error during addArticle process in DB:', error);
    if (error instanceof Error && 'code' in error && (error as any).code === '23505' && (error as any).constraint === 'articles_slug_key') {
      console.error(`articlesStore: Unique constraint violation for slug "${slug}".`);
      throw new Error(`An article with slug "${slug}" already exists.`);
    }
    throw error;
  }
};

export const updateArticle = async (updatedArticle: Article): Promise<Article | undefined> => {
  const { id, title, content, slug, tags, author, image_url, excerpt, data_ai_hint, likes } = updatedArticle;
  console.log(`articlesStore: Attempting to update article ${id} in DB`);
  try {
    const result = await pool.query<Article>(
      `UPDATE articles
       SET title = $1, content = $2, slug = $3, tags = $4, author = $5, image_url = $6, excerpt = $7, data_ai_hint = $8, likes = $9
       WHERE id = $10
       RETURNING *`,
      [title, content, slug, tags, author, image_url || null, excerpt || null, data_ai_hint || null, likes, id]
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
  } catch (error)
{
    console.error(`articlesStore: Error liking article ${id} in DB:`, error);
    throw error;
  }
};
