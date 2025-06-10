
"use client";

import { useParams } from 'next/navigation';
import { useArticles } from '@/contexts/ArticleContext';
import Image from 'next/image';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SocialShare from '@/components/SocialShare';
import FeaturedCodeSnippet from '@/components/FeaturedCodeSnippet';
import { CalendarDays, UserCircle, Tag, Edit3, ThumbsUp, Loader2, MessageSquare, MessageCirclePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useCallback } from 'react';
import type { Article, Comment as CommentType, PaginatedComments } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CommentList from '@/components/CommentList';
import CommentForm from '@/components/CommentForm';
import { fetchComments } from '@/app/actions/commentActions';

const COMMENTS_PER_PAGE = 5;

export default function ArticlePage() {
  const params = useParams();
  const { getArticleBySlug, articles: contextArticles, isLoading: isContextLoading } = useArticles();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  const [pageLoading, setPageLoading] = useState(true);

  const [articleComments, setArticleComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [isCommentFormVisible, setIsCommentFormVisible] = useState(false);

  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const fetchArticle = async () => {
        setPageLoading(true);
        try {
          const foundArticle = await getArticleBySlug(slug);
          setArticle(foundArticle);
        } catch (error) {
          console.error("Failed to fetch article:", error);
          setArticle(null);
        } finally {
          setPageLoading(false);
        }
      };
      fetchArticle();
    } else {
      setArticle(null);
      setPageLoading(false);
    }
  }, [slug, getArticleBySlug]);

  const displayArticle = contextArticles.find(a => a.slug === slug) || article;

  const loadComments = useCallback(async (page: number, append = false) => {
    if (!displayArticle?.id) return;

    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const result: PaginatedComments = await fetchComments(displayArticle.id, COMMENTS_PER_PAGE, (page - 1) * COMMENTS_PER_PAGE);
      if (append) {
        setArticleComments(prevComments => [...prevComments, ...result.comments]);
      } else {
        setArticleComments(result.comments);
      }
      setTotalComments(result.totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to load comments:", error);
      setCommentsError("Could not load comments. Please try again later.");
    } finally {
      setCommentsLoading(false);
    }
  }, [displayArticle?.id]);

  useEffect(() => {
    if (displayArticle?.id) {
      loadComments(1); 
    }
  }, [displayArticle?.id, loadComments]);

  const handleCommentAdded = () => {
    if (displayArticle?.id) {
      loadComments(1, false); 
      setIsCommentFormVisible(false); // Hide form after successful submission
    }
  };

  const handleLoadMoreComments = () => {
    loadComments(currentPage + 1, true);
  };

  const handleCancelComment = () => {
    setIsCommentFormVisible(false);
  };
  
  const handleCommentLiked = (updatedComment: CommentType) => {
    // This function is called when a comment is liked in CommentList.
    // We update the articleComments state to reflect the change immediately.
    setArticleComments(prevComments =>
      prevComments.map(c => (c.id === updatedComment.id ? updatedComment : c))
    );
    // Note: The totalComments state might not need updating for just a like.
    // If you wanted to refresh total comments from DB, you could call loadComments(1, false) here too.
  };


  if (pageLoading || (isContextLoading && displayArticle === undefined)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading article...</p>
      </div>
    );
  }
  
  if (displayArticle === null || displayArticle === undefined) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">Sorry, we couldn't find the article you're looking for.</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(displayArticle.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-headline">{displayArticle.title}</h1>
        <div className="flex flex-wrap items-center text-sm text-muted-foreground space-x-4 mb-4">
          <div className="flex items-center">
            <UserCircle className="w-5 h-5 mr-1.5" />
            <span>{displayArticle.author || 'Cloud Journal Team'}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 mr-1.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <ThumbsUp className="w-5 h-5 mr-1.5" />
            <span>{displayArticle.likes} Likes</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-1.5" />
            <span>{totalComments} Comments</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <Tag className="w-5 h-5 mr-1 text-muted-foreground self-center" />
          {displayArticle.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
            </Badge>
          ))}
        </div>
        {displayArticle.image_url && (
          <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={displayArticle.image_url}
              alt={displayArticle.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover"
              data-ai-hint={displayArticle.data_ai_hint || "technology abstract"}
            />
          </div>
        )}
      </header>

      <FeaturedCodeSnippet articleContent={displayArticle.content} />
      
      <div className="prose-base">
        <MarkdownRenderer content={displayArticle.content} />
      </div>

      <SocialShare article={displayArticle} />

      <section className="mt-10 pt-6 border-t">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold font-headline">Comments ({totalComments})</h2>
            {!isCommentFormVisible && (
            <Button variant="outline" onClick={() => setIsCommentFormVisible(true)}>
                <MessageCirclePlus className="mr-2 h-5 w-5" />
                Leave a Comment
            </Button>
            )}
        </div>

        {isCommentFormVisible && (
          <CommentForm 
            articleId={displayArticle.id} 
            onCommentAdded={handleCommentAdded}
            onCancel={handleCancelComment} 
          />
        )}
        
        {commentsLoading && articleComments.length === 0 && !isCommentFormVisible && (
          <div className="flex items-center justify-center my-6 p-4">
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Loading comments...</span>
          </div>
        )}
        {commentsError && (
          <p className="text-destructive my-4 text-center">{commentsError}</p>
        )}
        
        <CommentList initialComments={articleComments} onCommentLiked={handleCommentLiked} />

        {!commentsLoading && !commentsError && articleComments.length === 0 && (
             <p className="text-muted-foreground text-center my-6">Be the first to comment!</p>
        )}

        {!commentsLoading && (currentPage * COMMENTS_PER_PAGE) < totalComments && (
          <div className="text-center mt-6">
            <Button onClick={handleLoadMoreComments} variant="outline">
              Load More Comments
            </Button>
          </div>
        )}
      </section>
      
      <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href={`/admin/edit/${displayArticle.slug}`}>
                <Edit3 className="mr-2 h-4 w-4"/> Edit this Article (Admin)
            </Link>
          </Button>
      </div>
    </article>
  );
}
