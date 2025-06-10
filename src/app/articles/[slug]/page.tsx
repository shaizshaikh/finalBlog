
"use client";

import { useParams } from 'next/navigation';
import { useArticles } from '@/contexts/ArticleContext';
import Image from 'next/image';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SocialShare from '@/components/SocialShare';
import FeaturedCodeSnippet from '@/components/FeaturedCodeSnippet';
import { CalendarDays, UserCircle, Tag, Edit3, ThumbsUp, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ArticlePage() {
  const params = useParams();
  const { getArticleBySlug, articles: contextArticles, isLoading: isContextLoading } = useArticles(); // Use async getArticleBySlug
  const [article, setArticle] = useState<Article | null | undefined>(undefined); // undefined for loading, null for not found
  const [pageLoading, setPageLoading] = useState(true);


  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const fetchArticle = async () => {
        setPageLoading(true);
        try {
          const foundArticle = await getArticleBySlug(slug);
          setArticle(foundArticle); // Will be Article or undefined if not found
        } catch (error) {
          console.error("Failed to fetch article:", error);
          setArticle(null); // Set to null on error
        } finally {
          setPageLoading(false);
        }
      };
      fetchArticle();
    } else {
      setArticle(null); // No slug, not found
      setPageLoading(false);
    }
  }, [slug, getArticleBySlug]);

  // Find the most up-to-date article data from context for likes, if available
  const displayArticle = contextArticles.find(a => a.slug === slug) || article;


  if (pageLoading || (isContextLoading && displayArticle === undefined)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading article...</p>
      </div>
    );
  }
  
  if (displayArticle === null || displayArticle === undefined) { // Not found state
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

  const formattedDate = new Date(displayArticle.createdAt).toLocaleDateString('en-US', {
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
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <Tag className="w-5 h-5 mr-1 text-muted-foreground self-center" />
          {displayArticle.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
            </Badge>
          ))}
        </div>
        {displayArticle.imageUrl && (
          <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={displayArticle.imageUrl}
              alt={displayArticle.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover"
              data-ai-hint={displayArticle.dataAiHint || "technology abstract"}
            />
          </div>
        )}
      </header>

      <FeaturedCodeSnippet articleContent={displayArticle.content} />
      
      <div className="prose-base">
        <MarkdownRenderer content={displayArticle.content} />
      </div>

      <SocialShare article={displayArticle} />
      
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

// Add generateStaticParams for better SSG if articles are static
// export async function generateStaticParams() {
//   // const articles = await fetchArticlesFromDb(); // Fetch all article slugs from DB
//   // return articles.map((article) => ({
//   //   slug: article.slug,
//   // }));
// }
