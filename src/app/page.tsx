
"use client"; 

import ArticleCard from '@/components/ArticleCard';
import type { Article, PaginatedArticles } from '@/types';
import { useArticles } from '@/contexts/ArticleContext'; 
import { getArticles as fetchArticlesFromDb } from '@/lib/articlesStore';
import { ARTICLES_PER_PAGE_HOME } from '@/config/constants';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';
import { aiEnhancedTagBasedSearch } from '@/ai/flows/tag-based-search';
import { Loader2, SearchX, NewspaperIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { allArticlesForSearch, isLoading: isContextLoading } = useArticles();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');

  // State for non-search article display
  const [homeArticles, setHomeArticles] = useState<Article[]>([]);
  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  const [homeTotalPages, setHomeTotalPages] = useState(0);
  const [homeIsLoading, setHomeIsLoading] = useState(true); // For initial load of home articles
  const [homeIsLoadingMore, setHomeIsLoadingMore] = useState(false);

  // State for AI search results
  const [aiSearchResults, setAiSearchResults] = useState<Article[]>([]); // Full list from AI
  const [displayedSearchResults, setDisplayedSearchResults] = useState<Article[]>([]); // Paginated subset
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const loadHomeArticles = useCallback(async (page: number, append = false) => {
    if (page === 1 && !append) setHomeIsLoading(true);
    else setHomeIsLoadingMore(true);

    try {
      const result: PaginatedArticles = await fetchArticlesFromDb(ARTICLES_PER_PAGE_HOME, (page - 1) * ARTICLES_PER_PAGE_HOME);
      if (append) {
        setHomeArticles(prev => [...prev, ...result.articles]);
      } else {
        setHomeArticles(result.articles);
      }
      setHomeTotalPages(result.totalPages);
      setHomeCurrentPage(result.currentPage); // API returns current page
    } catch (error) {
      console.error("Failed to load home articles:", error);
      // Handle error appropriately
    } finally {
      if (page === 1 && !append) setHomeIsLoading(false);
      else setHomeIsLoadingMore(false);
    }
  }, []);

  // Effect for loading home articles when search is cleared or on initial load without search
  useEffect(() => {
    if (!searchQuery) {
      loadHomeArticles(1);
    }
  // loadHomeArticles is memoized. searchQuery ensures this runs when search is cleared.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); 

  const paginateAISearchResults = useCallback((fullResults: Article[], page: number) => {
    const start = (page - 1) * ARTICLES_PER_PAGE_HOME;
    const end = start + ARTICLES_PER_PAGE_HOME;
    setDisplayedSearchResults(prev => page === 1 ? fullResults.slice(start, end) : [...prev, ...fullResults.slice(start, end)]);
    setSearchCurrentPage(page);
    setSearchTotalPages(Math.ceil(fullResults.length / ARTICLES_PER_PAGE_HOME));
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery && allArticlesForSearch.length > 0) {
        setIsAISearchLoading(true);
        setSearchError(null);
        setDisplayedSearchResults([]); 
        setSearchCurrentPage(1); 

        try {
          const queryTags = searchQuery.toLowerCase().split(' ').filter(tag => tag.length > 0);

          const resultsFromAI = await aiEnhancedTagBasedSearch({
            query: searchQuery,
            tags: queryTags, 
            articles: allArticlesForSearch.map(a => ({ 
              id: a.id, 
              title: a.title, 
              content: a.excerpt || a.content.substring(0,200), 
              tags: a.tags 
            }))
          });
          
          const matchedArticles = allArticlesForSearch.filter(originalArticle => 
            resultsFromAI.some(aiArticle => aiArticle.title === originalArticle.title)
          );
          setAiSearchResults(matchedArticles);
          paginateAISearchResults(matchedArticles, 1);

        } catch (error) {
          console.error("AI search failed:", error);
          setSearchError("AI search encountered an issue. Showing basic keyword match.");
          const filtered = allArticlesForSearch.filter(
            (article) =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (article.excerpt && article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
              article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
              article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setAiSearchResults(filtered);
          paginateAISearchResults(filtered, 1);
        } finally {
          setIsAISearchLoading(false);
        }
      } else if (!searchQuery) {
        // If search query is cleared, reset search-specific states.
        // Home articles are handled by a separate useEffect.
        setAiSearchResults([]);
        setDisplayedSearchResults([]);
        setSearchError(null);
      }
    };

    if (searchQuery) {
      // Only perform search if context isn't loading OR allArticlesForSearch is populated.
      // This prevents attempting search before essential data is ready.
      if (!isContextLoading || allArticlesForSearch.length > 0) {
        performSearch();
      }
      // If context is loading and allArticlesForSearch is empty, the effect will re-run when these dependencies change.
    } else {
      // No search query, ensure search-related states are cleared.
      performSearch(); // This will trigger the '!searchQuery' branch inside performSearch.
    }
  // paginateAISearchResults is memoized.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allArticlesForSearch, isContextLoading, paginateAISearchResults]);

  const handleLoadMoreHome = () => {
    if (homeCurrentPage < homeTotalPages) {
      loadHomeArticles(homeCurrentPage + 1, true);
    }
  };

  const handleLoadMoreSearch = () => {
    if (searchCurrentPage < searchTotalPages) {
      paginateAISearchResults(aiSearchResults, searchCurrentPage + 1);
    }
  };

  // Determine articles to display based on search or home view
  const articlesToDisplay = searchQuery ? displayedSearchResults : homeArticles;
  const isLoadingDisplay = searchQuery ? isAISearchLoading : homeIsLoading;
  const isLoadingMoreDisplay = searchQuery ? false : homeIsLoadingMore; 
  const canLoadMore = searchQuery 
    ? searchCurrentPage < searchTotalPages
    : homeCurrentPage < homeTotalPages;
  const loadMoreAction = searchQuery ? handleLoadMoreSearch : handleLoadMoreHome;


  if (isContextLoading && homeArticles.length === 0 && !searchQuery) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground font-headline">Loading articles...</p>
      </div>
    );
  }
  
  // This condition handles loading for initial search OR initial home content
  if (isLoadingDisplay && articlesToDisplay.length === 0) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground font-headline">
          {searchQuery ? 'Searching articles with AI...' : 'Loading articles...'}
        </p>
      </div>
    );
  }

  // Specific message for no search results found after search has completed
  if (searchQuery && articlesToDisplay.length === 0 && !isAISearchLoading && !isContextLoading) {
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
      {searchQuery && !isAISearchLoading && ( // Show search header only when search is active and not loading
        <div className="mb-6 pb-4 border-b">
          <h1 className="text-3xl font-bold font-headline">Search Results for "{searchQuery}"</h1>
          {searchError && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-destructive font-medium">{searchError}</p>
              <p className="text-sm text-muted-foreground">Displaying articles based on keyword match.</p>
            </div>
          )}
          {!searchError && <p className="text-muted-foreground mt-1">Found {aiSearchResults.length} articles matching your query.</p>}
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
      
      {!isContextLoading && articlesToDisplay.length === 0 && !isLoadingDisplay && !searchQuery && (
         <div className="text-center py-10">
          <NewspaperIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 font-headline">No Articles Yet</h2>
          <p className="text-muted-foreground mb-6">
            Check back soon for new content or visit the admin dashboard to create articles.
          </p>
          <Button asChild>
            <Link href="/admin">Go to Admin</Link>
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {articlesToDisplay.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {articlesToDisplay.length > 0 && canLoadMore && (
        <div className="text-center mt-8">
          <Button 
            onClick={loadMoreAction} 
            disabled={isLoadingMoreDisplay || (searchQuery && isAISearchLoading && searchCurrentPage === 1)}
            variant="outline"
          >
            {(isLoadingMoreDisplay || (searchQuery && isAISearchLoading && searchCurrentPage === 1)) ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoadingMoreDisplay ? 'Loading...' : (searchQuery ? 'Load More Search Results' : 'Load More Articles')}
          </Button>
        </div>
      )}
    </div>
  );
}

    