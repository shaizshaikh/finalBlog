
// IMPORTANT: This file should be placed in:
// src/app/secure-admin-zone/edit/[slug]/page.tsx
// AFTER you have manually renamed `src/app/admin` to `src/app/secure-admin-zone`

"use client";

import AdminArticleForm from '@/components/admin/AdminArticleForm';
import { useArticles } from '@/contexts/ArticleContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Article } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

export const dynamic = 'force-dynamic'; // Prevent prerendering issues

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { getArticleBySlug, isLoading: isContextLoading } = useArticles(); 
  const [article, setArticle] = useState<Article | null | undefined>(undefined); 
  const [pageLoading, setPageLoading] = useState(true);
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const slug = typeof params.slug === 'string' ? params.slug : '';

  useEffect(() => {
    if (slug) {
      const fetchArticle = async () => {
        setPageLoading(true);
        try {
          const foundArticle = await getArticleBySlug(slug);
          setArticle(foundArticle); 
        } catch (error) {
          console.error("Failed to fetch article for editing:", error);
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


  if (pageLoading || (isContextLoading && article === undefined)) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading article data...</p>
      </div>
    );
  }
  
  if (!adminSecretUrlSegment) {
    return (
     <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
       <p className="mt-4 text-lg text-muted-foreground">Admin configuration not loaded.</p>
     </div>
   );
 }
  
  if (article === null || article === undefined) { 
    return (
        <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">Sorry, we couldn't find the article to edit.</p>
            <Button asChild>
            <Link href={`/${adminSecretUrlSegment}`}>Back to Admin Dashboard</Link>
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
