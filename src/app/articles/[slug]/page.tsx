"use client";

import { useParams } from 'next/navigation';
import { useArticles } from '@/contexts/ArticleContext';
import Image from 'next/image';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import SocialShare from '@/components/SocialShare';
import FeaturedCodeSnippet from '@/components/FeaturedCodeSnippet';
import { CalendarDays, UserCircle, Tag, Edit3, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ArticlePage() {
  const params = useParams();
  const { getArticleBySlug, articles: contextArticles } = useArticles();
  const [article, setArticle] = useState<Article | null | undefined>(null); // undefined for loading, null for not found

  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const foundArticle = getArticleBySlug(slug);
      setArticle(foundArticle);
    }
  }, [slug, getArticleBySlug, contextArticles]); // Rerun if contextArticles changes (e.g. after a like)


  if (article === undefined) { // Loading state
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><p className="text-xl">Loading article...</p></div>;
  }

  if (article === null) { // Not found state
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

  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
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
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <Tag className="w-5 h-5 mr-1 text-muted-foreground self-center" />
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-sm">
              {tag}
            </Badge>
          ))}
        </div>
        {article.imageUrl && (
          <div className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-lg mb-8">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
              className="object-cover"
              data-ai-hint={article.dataAiHint || "technology abstract"}
            />
          </div>
        )}
      </header>

      <FeaturedCodeSnippet articleContent={article.content} />
      
      <div className="prose-base">
        <MarkdownRenderer content={article.content} />
      </div>

      <SocialShare article={article} />
      
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

// Add generateStaticParams for better SSG if articles are static
// export async function generateStaticParams() {
//   const articles = getAllArticlesFromSomeSource(); // Fetch all article slugs
//   return articles.map((article) => ({
//     slug: article.slug,
//   }));
// }

