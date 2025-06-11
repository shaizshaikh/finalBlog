
"use client";

import ArticleCard from '@/components/ArticleCard';
import type { Article, PaginatedArticles, ArticleSortOption } from '@/types';
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
  const sortQuery = searchParams.get('sort') as ArticleSortOption | null;

  const [homeArticles, setHomeArticles] = useState<Article[]>([]);
  const [homeCurrentPage, setHomeCurrentPage] = useState(1);
  const [homeTotalPages, setHomeTotalPages] = useState(0);
  const [homeIsLoading, setHomeIsLoading] = useState(true);
  const [homeIsLoadingMore, setHomeIsLoadingMore] = useState(false);

  const [currentSortOption, setCurrentSortOption] = useState<ArticleSortOption>("newest");

  const [aiSearchResults, setAiSearchResults] = useState<Article[]>([]);
  const [displayedSearchResults, setDisplayedSearchResults] = useState<Article[]>([]);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(0);
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchStatusMessage, setSearchStatusMessage] = useState<string | null>(null);


  useEffect(() => {
    const sortFromUrl = sortQuery || 'newest';
    setCurrentSortOption(sortFromUrl);
    if (!searchQuery && sortFromUrl !== currentSortOption) {
      loadHomeArticles(1, false, sortFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortQuery, searchQuery]); 

  const loadHomeArticles = useCallback(async (page: number, append = false, sortOrder = currentSortOption) => {
    console.log(`HomePage: loadHomeArticles for page ${page}, sort: ${sortOrder}, append: ${append}`);
    if (page === 1 && !append) {
      setHomeIsLoading(true);
      setSearchStatusMessage("Loading articles...");
    } else {
      setHomeIsLoadingMore(true);
    }

    try {
      const result: PaginatedArticles = await fetchArticlesFromDb(ARTICLES_PER_PAGE_HOME, (page - 1) * ARTICLES_PER_PAGE_HOME, sortOrder);
      if (append) {
        setHomeArticles(prev => [...prev, ...result.articles]);
      } else {
        setHomeArticles(result.articles);
      }
      setHomeTotalPages(result.totalPages);
      setHomeCurrentPage(result.currentPage);
      if (page === 1 && !append) setSearchStatusMessage(`Showing ${result.articles.length} of ${result.totalCount} articles.`);
    } catch (error) {
      console.error("Failed to load home articles:", error);
      if (page === 1 && !append) setSearchStatusMessage("Error loading articles.");
    } finally {
      if (page === 1 && !append) setHomeIsLoading(false);
      else setHomeIsLoadingMore(false);
    }
  }, [currentSortOption]); 

  useEffect(() => {
    if (!searchQuery) {
      console.log(`HomePage: No search query, loading home articles with sort: ${currentSortOption}`);
      loadHomeArticles(1, false, currentSortOption);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentSortOption, loadHomeArticles]);

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
        setSearchStatusMessage(`Searching for "${searchQuery}"...`);

        try {
          const queryTags = searchQuery.toLowerCase().split(' ').filter(tag => tag.length > 0);
          const resultsFromAI = await aiEnhancedTagBasedSearch({
            query: searchQuery,
            tags: queryTags,
            articles: allArticlesForSearch.map(a => ({
              id: a.id,
              title: a.title,
              content: a.excerpt || a.content.substring(0,500),
              tags: a.tags,
              slug: a.slug, 
              created_at: a.created_at,
              author: a.author,
              image_url: a.image_url,
              likes: a.likes,
              data_ai_hint: a.data_ai_hint
            }))
          });

          const matchedArticles = resultsFromAI
            .map(aiArticle => allArticlesForSearch.find(originalArticle => originalArticle.id === aiArticle.id))
            .filter((article): article is Article => article !== undefined);

          setAiSearchResults(matchedArticles);
          paginateAISearchResults(matchedArticles, 1);
          setSearchStatusMessage(`Found ${matchedArticles.length} articles matching your query "${searchQuery}".`);


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
          setSearchStatusMessage(`Found ${filtered.length} articles using basic keyword match for "${searchQuery}".`);

        } finally {
          setIsAISearchLoading(false);
          // Check if search is done and no results were found BEFORE setting the message
          // This state will be derived from aiSearchResults.length after performSearch completes
        }
      } else if (!searchQuery) {
        setAiSearchResults([]);
        setDisplayedSearchResults([]);
        setSearchError(null);
        setSearchStatusMessage(null); // Clear search message when not searching
      }
    };

    if (searchQuery) {
      if (!isContextLoading || allArticlesForSearch.length > 0) {
        performSearch();
      } else if (isContextLoading) {
        setSearchStatusMessage("Loading article data before searching...");
      }
    } else {
       setAiSearchResults([]);
       setDisplayedSearchResults([]);
       setSearchError(null);
       setSearchStatusMessage(null); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allArticlesForSearch, isContextLoading, paginateAISearchResults]);

  // Effect to update message when search results are empty after search completion
  useEffect(() => {
    if (searchQuery && !isAISearchLoading && aiSearchResults.length === 0) {
        setSearchStatusMessage(`No articles found for "${searchQuery}".`);
    }
  }, [searchQuery, isAISearchLoading, aiSearchResults.length]);


  const handleLoadMoreHome = () => {
    if (homeCurrentPage < homeTotalPages) {
      loadHomeArticles(homeCurrentPage + 1, true, currentSortOption);
    }
  };

  const handleLoadMoreSearch = () => {
    if (searchCurrentPage < searchTotalPages) {
      paginateAISearchResults(aiSearchResults, searchCurrentPage + 1);
    }
  };

  const articlesToDisplay = searchQuery ? displayedSearchResults : homeArticles;
  const isLoadingDisplay = searchQuery
    ? (isAISearchLoading && displayedSearchResults.length === 0)
    : (homeIsLoading && homeArticles.length === 0);

  const isLoadingMoreDisplay = searchQuery ? (isAISearchLoading && displayedSearchResults.length > 0) : homeIsLoadingMore;
  const canLoadMore = searchQuery
    ? searchCurrentPage < searchTotalPages
    : homeCurrentPage < homeTotalPages;
  const loadMoreAction = searchQuery ? handleLoadMoreSearch : handleLoadMoreHome;

  if ((isContextLoading && allArticlesForSearch.length === 0 && !searchQuery) || (isLoadingDisplay && articlesToDisplay.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground font-headline" role="status" aria-live="polite" aria-atomic="true">
          {searchStatusMessage || 'Loading articles...'}
        </p>
      </div>
    );
  }
  
  if (searchQuery && articlesToDisplay.length === 0 && !isAISearchLoading && !isContextLoading) {
    return (
      <div className="text-center py-10">
        <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2 font-headline">No Articles Found</h1>
        <div role="status" aria-live="polite" aria-atomic="true" className="text-muted-foreground mb-6">
           {searchStatusMessage || `Your search for "${searchQuery}" did not match any articles. Try a different query or explore all articles.`}
        </div>
        <Button asChild variant="outline">
          <Link href="/">View All Articles</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {searchStatusMessage}
      </div>
      {searchQuery && (
        <div className="mb-2">
          <h1 className="text-3xl font-bold font-headline">Search Results for "{searchQuery}"</h1>
          {searchError && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-destructive font-medium">{searchError}</p>
              <p className="text-sm text-muted-foreground">Displaying articles based on keyword match.</p>
            </div>
          )}
           {!searchError && !isAISearchLoading && <p className="text-muted-foreground mt-1">{aiSearchResults.length} {aiSearchResults.length === 1 ? "article" : "articles"} found.</p>}
        </div>
      )}

      {!searchQuery && !homeIsLoading && (
        <div className="mb-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-1 font-headline">Welcome to Cloud Journal</h1>
              <p className="text-xl text-muted-foreground">
                Your daily digest of insights in cloud technology and development.
              </p>
            </div>
          </div>
        </div>
      )}

      {searchQuery && isAISearchLoading && articlesToDisplay.length > 0 && (
         <div className="flex items-center justify-center my-6 p-4 rounded-md bg-muted/50">
            <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">Updating search for "{searchQuery}"...</span>
        </div>
      )}

      {!isContextLoading && articlesToDisplay.length === 0 && !isLoadingDisplay && !searchQuery && (
         <div className="text-center py-10">
          <NewspaperIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 font-headline">No Articles Yet</h2>
          <p className="text-muted-foreground mb-6">
            Check back soon for new content!
          </p>
          {/* Removed "Go to Admin" button from here */}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {articlesToDisplay.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {articlesToDisplay.length > 0 && canLoadMore && !isLoadingMoreDisplay && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMoreAction}
            disabled={(isAISearchLoading && searchQuery != null) || homeIsLoadingMore}
            variant="outline"
          >
            {(isAISearchLoading && searchQuery != null) || homeIsLoadingMore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {(isAISearchLoading && searchQuery != null) || homeIsLoadingMore ? 'Loading...' : (searchQuery ? 'Load More Search Results' : 'Load More Articles')}
          </Button>
        </div>
      )}
    </div>
  );
}
