"use client"; // Required for useState, useEffect, useSearchParams

import ArticleCard from '@/components/ArticleCard';
import type { Article } from '@/types';
import { useArticles } from '@/contexts/ArticleContext'; // Using context for client-side state
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { aiEnhancedTagBasedSearch } from '@/ai/flows/tag-based-search';
import { Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { articles: allArticlesFromContext } = useArticles();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery && allArticlesFromContext.length > 0) {
        setIsLoading(true);
        setSearchError(null);
        try {
          // For AI search, we might want to extract potential tags from the query
          // or use a predefined set of important tags. For simplicity, we'll pass an empty array for now or try to split query.
          const queryTags = searchQuery.toLowerCase().split(' ').filter(tag => tag.length > 2); // Simple tag extraction

          const results = await aiEnhancedTagBasedSearch({
            query: searchQuery,
            tags: queryTags, // Or pass a specific set of tags from your app logic
            articles: allArticlesFromContext.map(a => ({ title: a.title, content: a.excerpt || a.content.substring(0,200), tags: a.tags }))
          });
          
          // The AI returns articles that match. We need to find these in our original list to keep all data.
          const matchedArticles = allArticlesFromContext.filter(originalArticle => 
            results.some(aiArticle => aiArticle.title === originalArticle.title)
          );
          setDisplayedArticles(matchedArticles);

        } catch (error) {
          console.error("AI search failed:", error);
          setSearchError("AI search encountered an issue. Showing basic results.");
          // Fallback to basic client-side search if AI fails
          const filtered = allArticlesFromContext.filter(
            (article) =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setDisplayedArticles(filtered);
        } finally {
          setIsLoading(false);
        }
      } else {
        setDisplayedArticles(allArticlesFromContext);
        setIsLoading(false);
        setSearchError(null);
      }
    };

    performSearch();
  }, [searchQuery, allArticlesFromContext]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground font-headline">Searching articles with AI...</p>
      </div>
    );
  }
  
  if (searchError) {
     // Error message already shown inside the component, articles will be from fallback
  }

  if (searchQuery && displayedArticles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2 font-headline">No Articles Found</h2>
        <p className="text-muted-foreground mb-6">
          Your search for "{searchQuery}" did not match any articles. Try a different query or explore all articles.
        </p>
        <Button asChild variant="outline">
          <Link href="/">View All Articles</Link>
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {searchQuery && !searchError && (
        <div className="mb-6 pb-4 border-b">
          <h1 className="text-3xl font-bold font-headline">Search Results for "{searchQuery}"</h1>
          <p className="text-muted-foreground mt-1">Found {displayedArticles.length} articles using AI-enhanced search.</p>
        </div>
      )}
      {searchError && (
         <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md">
           <p className="text-destructive font-medium">{searchError}</p>
         </div>
      )}
      {!searchQuery && (
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-3 font-headline">Welcome to Cloud Journal</h1>
          <p className="text-xl text-muted-foreground">
            Your daily digest of insights in cloud technology and development.
          </p>
        </div>
      )}
      
      {displayedArticles.length === 0 && !isLoading && !searchQuery && (
         <div className="text-center py-10">
          <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 font-headline">No Articles Yet</h2>
          <p className="text-muted-foreground mb-6">
            Check back soon for new content or visit the admin dashboard to create articles.
          </p>
          <Button asChild>
            <Link href="/admin">Go to Admin</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
