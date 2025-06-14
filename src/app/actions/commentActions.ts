
'use server';

import { z } from 'zod';
import { addCommentToDb, getCommentsByArticleIdFromDb, likeCommentInDb, dislikeCommentInDb, type AddCommentData } from '@/lib/commentsStore';
import type { Comment, PaginatedComments } from '@/types';

const commentSchema = z.object({
  articleId: z.string().uuid({ message: "Invalid article ID."}),
  authorName: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  content: z.string().min(5, "Comment must be at least 5 characters.").max(1000, "Comment too long."),
});

interface SubmitCommentResult {
  success: boolean;
  message: string;
  comment?: Comment; // Return the created comment on success
}

export async function submitComment(formData: {
  articleId: string;
  authorName: string;
  content: string;
}): Promise<SubmitCommentResult> {
  const validationResult = commentSchema.safeParse(formData);

  if (!validationResult.success) {
    return { success: false, message: validationResult.error.issues[0].message };
  }

  const { articleId, authorName, content } = validationResult.data;

  try {
    const commentData: AddCommentData = {
      article_id: articleId,
      author_name: authorName,
      content: content,
    };
    const newComment = await addCommentToDb(commentData);
    return { success: true, message: 'Comment submitted successfully!', comment: newComment };
  } catch (error) {
    console.error('Error submitting comment action:', error);
    return { success: false, message: 'Failed to submit comment. Please try again.' };
  }
}

export async function fetchComments(
  articleId: string,
  limit: number,
  offset: number
): Promise<PaginatedComments> {
  if (!articleId) {
    console.warn('fetchComments called with no articleId');
    return { comments: [], totalCount: 0 };
  }
  try {
    return await getCommentsByArticleIdFromDb(articleId, limit, offset);
  } catch (error) {
    console.error(`Error fetching comments for article ${articleId}:`, error);
    // In a real app, you might want to throw or return a more specific error structure
    return { comments: [], totalCount: 0 }; 
  }
}

interface LikeDislikeCommentResult {
  success: boolean;
  updatedComment?: Comment;
  message?: string;
}

export async function likeComment(commentId: string): Promise<LikeDislikeCommentResult> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is required.' };
  }
  try {
    const updatedComment = await likeCommentInDb(commentId);
    if (!updatedComment) {
      return { success: false, message: 'Comment not found or could not be liked.' };
    }
    return { success: true, updatedComment };
  } catch (error) {
    console.error(`Error liking comment ${commentId}:`, error);
    return { success: false, message: 'Failed to like comment.' };
  }
}

export async function dislikeComment(commentId: string): Promise<LikeDislikeCommentResult> {
  if (!commentId) {
    return { success: false, message: 'Comment ID is required.' };
  }
  try {
    const updatedComment = await dislikeCommentInDb(commentId);
    if (!updatedComment) {
      return { success: false, message: 'Comment not found or could not be disliked.' };
    }
    return { success: true, updatedComment };
  } catch (error) {
    console.error(`Error disliking comment ${commentId}:`, error);
    return { success: false, message: 'Failed to dislike comment.' };
  }
}
