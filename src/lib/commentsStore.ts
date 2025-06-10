
'use server';

import type { Comment } from '@/types';
import pool from '@/lib/db';

export interface AddCommentData {
  article_id: string;
  author_name: string;
  content: string;
}

export const addCommentToDb = async (commentData: AddCommentData): Promise<Comment> => {
  const { article_id, author_name, content } = commentData;
  console.log(`commentsStore: Adding comment for article_id ${article_id}`);
  try {
    const result = await pool.query<Comment>(
      `INSERT INTO comments (article_id, author_name, content, is_approved, created_at, likes, dislikes)
       VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP, 0, 0)
       RETURNING *`,
      [article_id, author_name, content]
    );
    if (result.rows.length === 0) {
      throw new Error('Comment creation failed, no rows returned.');
    }
    console.log(`commentsStore: Comment added with id ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    console.error('commentsStore: Error adding comment to DB:', error);
    throw error;
  }
};

export const getCommentsByArticleIdFromDb = async (
  article_id: string,
  limit: number,
  offset: number
): Promise<{ comments: Comment[]; totalCount: number }> => {
  console.log(`commentsStore: Fetching comments for article_id ${article_id}, limit ${limit}, offset ${offset}`);
  try {
    // Query for comments with pagination
    const commentsResult = await pool.query<Comment>(
      `SELECT id, article_id, author_name, content, created_at, is_approved, likes, dislikes FROM comments
       WHERE article_id = $1 AND is_approved = TRUE
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [article_id, limit, offset]
    );

    // Query for total count of approved comments for the article
    const totalCountResult = await pool.query<{ count: string }>(
      'SELECT COUNT(*) FROM comments WHERE article_id = $1 AND is_approved = TRUE',
      [article_id]
    );
    
    const totalCount = parseInt(totalCountResult.rows[0].count, 10) || 0;

    console.log(`commentsStore: Fetched ${commentsResult.rowCount} comments for article_id ${article_id}. Total approved: ${totalCount}`);
    return {
      comments: commentsResult.rows,
      totalCount: totalCount,
    };
  } catch (error) {
    console.error(`commentsStore: Error fetching comments for article_id ${article_id} from DB:`, error);
    throw error;
  }
};

export const likeCommentInDb = async (commentId: string): Promise<Comment | undefined> => {
  console.log(`commentsStore: Liking comment ${commentId}`);
  try {
    const result = await pool.query<Comment>(
      'UPDATE comments SET likes = likes + 1 WHERE id = $1 RETURNING *',
      [commentId]
    );
    if (result.rowCount === 0) {
      console.warn(`commentsStore: Comment ${commentId} not found for liking.`);
      return undefined;
    }
    console.log(`commentsStore: Comment ${commentId} liked. New likes: ${result.rows[0].likes}`);
    return result.rows[0];
  } catch (error) {
    console.error(`commentsStore: Error liking comment ${commentId} in DB:`, error);
    throw error;
  }
};

export const dislikeCommentInDb = async (commentId: string): Promise<Comment | undefined> => {
  console.log(`commentsStore: Disliking comment ${commentId}`);
  try {
    const result = await pool.query<Comment>(
      'UPDATE comments SET dislikes = dislikes + 1 WHERE id = $1 RETURNING *',
      [commentId]
    );
    if (result.rowCount === 0) {
      console.warn(`commentsStore: Comment ${commentId} not found for disliking.`);
      return undefined;
    }
    console.log(`commentsStore: Comment ${commentId} disliked. New dislikes: ${result.rows[0].dislikes}`);
    return result.rows[0];
  } catch (error) {
    console.error(`commentsStore: Error disliking comment ${commentId} in DB:`, error);
    throw error;
  }
};
