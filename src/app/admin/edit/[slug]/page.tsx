"use client";

import AdminArticleForm from '@/components/admin/AdminArticleForm';
import { useArticles } from '@/contexts/ArticleContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { getArticleBySlug } = useArticles();
  const [article, setArticle] = useState<Article | null | undefined>(undefined);

  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const foundArticle = getArticleBySlug(slug);
      setArticle(foundArticle);
      if (foundArticle === undefined && slug) { // check if slug is not empty before redirecting
         // After context might have loaded, if still undefined, it means not found
         // This check might be too aggressive if context is slow to populate
         // For a robust solution, a dedicated loading state or fetching from server is better
      }
    }
  }, [slug, getArticleBySlug]);


  if (article === undefined) {
    return <p className="text-center py-10">Loading article data...</p>;
  }

  if (article === null) {
    return (
        <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">Sorry, we couldn't find the article to edit.</p>
            <Button asChild>
            <Link href="/admin">Back to Admin Dashboard</Link>
            </Button>
        </div>
    );
  }


  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 font-headline">Edit Article: <span className="text-primary">{article.title}</span></h2>
      <AdminArticleForm article={article} />
    </div>
  );
}
