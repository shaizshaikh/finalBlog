
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
  const { getArticleBySlug, isLoading: isContextLoading } = useArticles();
  
  // article state:
  // undefined: actively trying to load the article.
  // Article object: article successfully loaded.
  // null: article explicitly determined to be not found, or an error occurred during fetch.
  const [article, setArticle] = useState<Article | null | undefined>(undefined);
  
  // Page-level loading state, distinct from the article data state.
  // This could be true if, for instance, comments are loading even if the article is found.
  // For the main article fetch, it mirrors the period when `article` is `undefined`.
  const [isPageLoading, setIsPageLoading] = useState(true);


  const [articleComments, setArticleComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsCurrentPage, setCommentsCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [isCommentFormVisible, setIsCommentFormVisible] = useState(false);

  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const fetchArticleData = async () => {
        console.log(`ArticlePage: Initiating fetch for slug: "${slug}". isContextLoading: ${isContextLoading}`);
        setArticle(undefined); // Reset to loading state for the article object itself
        setIsPageLoading(true); // General page loading indicator

        try {
          // getArticleBySlug will use allArticlesForSearch if context is loaded, otherwise fallback to DB
          const foundArticle = await getArticleBySlug(slug);
          if (foundArticle) {
            console.log(`ArticlePage: SUCCESS - Article found for slug "${slug}": ${foundArticle.title}`);
            setArticle(foundArticle);
          } else {
            console.log(`ArticlePage: FAILED - Article NOT found for slug "${slug}" after getArticleBySlug.`);
            setArticle(null); // Explicitly set to null (not found)
          }
        } catch (error) {
          console.error(`ArticlePage: CRITICAL ERROR fetching article data for slug "${slug}":`, error);
          setArticle(null); // Error occurred
        } finally {
          setIsPageLoading(false); // Finished attempting to load the article data
          console.log(`ArticlePage: Fetch attempt finished for slug "${slug}". Article state:`, article === undefined ? "loading" : (article === null ? "not found/error" : "found"));
        }
      };
      
      fetchArticleData();
    } else {
      console.log("ArticlePage: No slug provided, setting article to null.");
      setArticle(null); // No slug, so definitely not found
      setIsPageLoading(false);
    }
  // getArticleBySlug reference changes when its deps (allArticlesForSearch, isContextLoading) change.
  // isContextLoading ensures this effect re-runs if context was busy during the first attempt.
  }, [slug, getArticleBySlug, isContextLoading]);


  const loadComments = useCallback(async (page: number, append = false) => {
    // Only load comments if we have a valid article ID
    if (!article?.id) {
        console.log("ArticlePage: loadComments - Aborted, article or article.id is not available.");
        setCommentsLoading(false); // Ensure loading state is false if we can't proceed
        return;
    }

    console.log(`ArticlePage: loadComments for article ID ${article.id}, page ${page}`);
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const result: PaginatedComments = await fetchComments(article.id, COMMENTS_PER_PAGE, (page - 1) * COMMENTS_PER_PAGE);
      if (append) {
        setArticleComments(prevComments => [...prevComments, ...result.comments]);
      } else {
        setArticleComments(result.comments);
      }
      setTotalComments(result.totalCount);
      setCommentsCurrentPage(page);
    } catch (error) {
      console.error("ArticlePage: Failed to load comments:", error);
      setCommentsError("Could not load comments. Please try again later.");
    } finally {
      setCommentsLoading(false);
    }
  }, [article?.id]); // Depend on article.id to re-trigger if the article changes

  useEffect(() => {
    // This effect will run once the `article` state is populated (and is not null/undefined).
    if (article && article.id) {
      console.log(`ArticlePage: Article (ID: ${article.id}) is loaded, now loading comments for it.`);
      loadComments(1); 
    } else if (article === null) {
        console.log("ArticlePage: Article is null (not found/error), skipping comment load.");
        // Reset comments if article is not found or errored
        setArticleComments([]);
        setTotalComments(0);
        setCommentsCurrentPage(1);
        setCommentsLoading(false);
    }
  }, [article, loadComments]); // Re-run if 'article' object itself changes or 'loadComments' function reference changes.

  const handleCommentAdded = () => {
    if (article?.id) {
      loadComments(1, false); 
      setIsCommentFormVisible(false); 
    }
  };

  const handleLoadMoreComments = () => {
    loadComments(commentsCurrentPage + 1, true);
  };

  const handleCancelComment = () => {
    setIsCommentFormVisible(false);
  };
  
  const handleCommentLikedOrDisliked = (updatedComment: CommentType) => {
    setArticleComments(prevComments =>
      prevComments.map(c => (c.id === updatedComment.id ? updatedComment : c))
    );
  };

  // Primary loading state: if article is 'undefined', it means we are actively trying to fetch it.
  if (article === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading article for slug: "{slug}"...</p>
      </div>
    );
  }
  
  // Not found state: if article is 'null', it means fetch completed but no article was found or an error occurred.
  if (article === null) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-8">Sorry, we couldn't find an article with the slug: "{slug}".</p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  // If we reach here, 'article' is a valid Article object.
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-headline">{article.title}</h1>
        <div className="flex flex-wrap items-center text-sm text-muted-foreground space-x-4 mb-4">
          <div className="flex items-center">
            <UserCircle className="w-5 h-5 mr-1.5" />
            <span>{article.author || 'Cloud Journal Team'}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-5 h-5 mr-1.5" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center">
            <ThumbsUp className="w-5 h-5 mr-1.5" />
            <span>{article.likes} Likes</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-1.5" />
            <span>{totalComments} Comments</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <Tag className="w-5 h-5 mr-1 text-muted-foreground self-center" />
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
            </Badge>
          ))}
        </div>
        {article.image_url && (
          <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover"
              data-ai-hint={article.data_ai_hint || "technology abstract"}
            />
          </div>
        )}
      </header>

      <FeaturedCodeSnippet articleContent={article.content} />
      
      <div className="prose-base">
        <MarkdownRenderer content={article.content} />
      </div>

      <SocialShare article={article} />

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
            articleId={article.id} 
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
        
        <CommentList initialComments={articleComments} onCommentLikedOrDisliked={handleCommentLikedOrDisliked} />

        {!commentsLoading && !commentsError && articleComments.length === 0 && !isCommentFormVisible && (
             <p className="text-muted-foreground text-center my-6">Be the first to comment!</p>
        )}

        {!commentsLoading && (commentsCurrentPage * COMMENTS_PER_PAGE) < totalComments && (
          <div className="text-center mt-6">
            <Button onClick={handleLoadMoreComments} variant="outline">
              Load More Comments
            </Button>
          </div>
        )}
      </section>
      
      <div className="mt-12 text-center">
          <Button asChild variant="outline">
            <Link href={`/admin/edit/${article.slug}`}>
                <Edit3 className="mr-2 h-4 w-4"/> Edit this Article (Admin)
            </Link>
          </Button>
      </div>
    </article>
  );
}

