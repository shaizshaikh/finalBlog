
"use client";

import type { Article, PaginatedArticles } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  getArticles as fetchArticlesFromDb, 
  addArticle as addArticleToDb,
  updateArticle as updateArticleInDb,
  deleteArticle as deleteArticleFromDb,
  getArticleBySlug as getArticleBySlugFromDb,
  likeArticleById,
  getAllArticlesForSearch as fetchAllArticlesFromDb,
} from '@/lib/articlesStore'; 
import { ARTICLES_PER_PAGE_ADMIN } from '@/config/constants'; // Using admin for context's default pagination

type ArticleContextCreationData = Omit<Article, 'id' | 'created_at' | 'likes'>;

interface ArticleContextType {
  articles: Article[]; // Current page of articles (primarily for admin)
  allArticlesForSearch: Article[]; // All articles, for client-side search
  totalArticles: number; // Total articles for the current context pagination
  currentPage: number; // Current page for the context pagination
  totalPages: number; // Total pages for the context pagination
  isLoading: boolean; // General loading for initial context load
  isLoadingMore: boolean; // For loading subsequent pages specifically in context
  fetchPage: (page: number, itemsPerPage?: number) => Promise<void>; // For context pagination
  getArticleBySlug: (slug: string) => Promise<Article | undefined>;
  addArticle: (articleData: ArticleContextCreationData) => Promise<Article>;
  updateArticle: (article: Article) => Promise<Article | undefined>;
  deleteArticle: (id: string) => Promise<void>;
  likeArticle: (id: string) => Promise<void>;
  fetchAllArticles: () => Promise<void>; // Method to fetch all articles
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticlesForSearch, setAllArticlesForSearch] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const fetchPage = useCallback(async (page: number, itemsPerPage: number = ARTICLES_PER_PAGE_ADMIN) => {
    console.log(`ArticleContext: fetchPage called for page ${page}. Current isLoading: ${isLoading}, isLoadingMore: ${isLoadingMore}`);
    if (page === 1 && !isLoadingMore) setIsLoading(true); // Set isLoading true only if it's the first page and not a "load more" scenario already in progress by another call
    else setIsLoadingMore(true);
    
    try {
      const offset = (page - 1) * itemsPerPage;
      const paginatedResult = await fetchArticlesFromDb(itemsPerPage, offset);
      
      if (page === 1) {
        setArticles(paginatedResult.articles);
      } else {
        setArticles(prevArticles => {
          const newArticles = paginatedResult.articles.filter(
            (newArt) => !prevArticles.some((prevArt) => prevArt.id === newArt.id)
          );
          return [...prevArticles, ...newArticles];
        });
      }
      setTotalArticles(paginatedResult.totalCount);
      setCurrentPage(paginatedResult.currentPage); 
      setTotalPages(paginatedResult.totalPages);
      console.log(`ArticleContext: fetchPage success for page ${page}. Articles set. Total: ${paginatedResult.totalCount}`);
    } catch (error) {
      console.error(`ArticleContext: Failed to fetch page ${page} of articles:`, error);
      if (page === 1) {
        setArticles([]);
        setTotalArticles(0);
        setCurrentPage(1);
        setTotalPages(0);
      }
    } finally {
      if (page === 1 && !isLoadingMore) setIsLoading(false);
      else setIsLoadingMore(false);
      console.log(`ArticleContext: fetchPage finished for page ${page}. isLoading: ${isLoading}, isLoadingMore: ${isLoadingMore}`);
    }
  }, [isLoading, isLoadingMore]); // Added isLoading and isLoadingMore to ensure stable function reference unless these change

  const fetchAllArticles = useCallback(async () => {
    console.log("ArticleContext: fetchAllArticles called.");
    // This specific loading state is part of the main `isLoading` cycle via initialLoad
    try {
      const allFetchedArticles = await fetchAllArticlesFromDb();
      setAllArticlesForSearch(allFetchedArticles);
      console.log(`ArticleContext: fetchAllArticles success. ${allFetchedArticles.length} articles loaded for search.`);
    } catch (error) {
      console.error("ArticleContext: Failed to fetch all articles for search:", error);
      setAllArticlesForSearch([]);
    }
  }, []);
  
  useEffect(() => {
    const initialLoad = async () => {
      console.log("ArticleContext: Initial load starting...");
      setIsLoading(true);
      try {
        // Fetch all articles first, as this is often a dependency for other operations or views
        await fetchAllArticles(); 
        // Then fetch the first page for paginated views (e.g., admin)
        await fetchPage(1, ARTICLES_PER_PAGE_ADMIN);
        console.log("ArticleContext: Initial load completed successfully.");
      } catch(error) {
        console.error("ArticleContext: Error during initial load:", error);
      } finally {
        setIsLoading(false);
        console.log("ArticleContext: Initial load finished. isLoading set to false.");
      }
    };
    initialLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Relies on useCallback for stable fetchPage and fetchAllArticles


  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | undefined> => {
    console.log(`ArticleContext: getArticleBySlug attempting for slug: "${slug}". isContextLoading: ${isLoading}, allArticlesForSearch length: ${allArticlesForSearch.length}`);
    
    // Attempt to find in allArticlesForSearch first
    // Ensure allArticlesForSearch is not empty AND context is not in its initial loading phase before trusting it solely
    if (!isLoading && allArticlesForSearch.length > 0) {
        const foundInAll = allArticlesForSearch.find(a => a.slug === slug);
        if (foundInAll) {
          console.log(`ArticleContext: SUCCESS - Found article "${slug}" in allArticlesForSearch.`);
          return foundInAll;
        }
        console.log(`ArticleContext: INFO - Article "${slug}" not in allArticlesForSearch (length: ${allArticlesForSearch.length}). Context not loading. Proceeding to DB fallback.`);
    } else if (isLoading) {
        console.log(`ArticleContext: INFO - Context is loading or allArticlesForSearch is empty. Forcing DB call for slug "${slug}".`);
    }


    // Fallback to direct DB query
    try {
      console.log(`ArticleContext: Attempting DB fallback for slug "${slug}".`);
      const articleFromDb = await getArticleBySlugFromDb(slug); // This is the DB call from articlesStore
      if (articleFromDb) {
        console.log(`ArticleContext: SUCCESS - Found article "${slug}" via DB fallback.`);
      } else {
        console.warn(`ArticleContext: FAILED - Article "${slug}" not found via DB fallback either.`);
      }
      return articleFromDb;
    } catch (error) {
      console.error(`ArticleContext: ERROR - DB fallback for slug "${slug}" failed:`, error);
      return undefined;
    }
  }, [allArticlesForSearch, isLoading]); // isLoading is crucial here

  const addArticle = useCallback(async (articleData: ArticleContextCreationData): Promise<Article> => {
    console.log("ArticleContext: addArticle called.");
    try {
      const newArticle = await addArticleToDb(articleData);
      await fetchAllArticles(); // Refresh all articles list first
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); // Then refresh admin to page 1
      return newArticle;
    } catch (error) {
      console.error("ArticleContext: Failed to add article:", error);
      throw error;
    }
  }, [fetchPage, fetchAllArticles]);

  const updateArticle = useCallback(async (article: Article): Promise<Article | undefined> => {
    console.log("ArticleContext: updateArticle called.");
    try {
      const updated = await updateArticleInDb(article);
      await fetchAllArticles(); 
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); 
      return updated;
    } catch (error) {
      console.error("ArticleContext: Failed to update article:", error);
      throw error;
    }
  }, [fetchPage, fetchAllArticles, currentPage]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    console.log("ArticleContext: deleteArticle called.");
    try {
      await deleteArticleFromDb(id);
      await fetchAllArticles();
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); 
    } catch (error) {
      console.error("ArticleContext: Failed to delete article:", error);
      throw error;
    }
  }, [fetchPage, fetchAllArticles]);
  
  const likeArticle = useCallback(async (id: string): Promise<void> => {
    console.log(`ArticleContext: likeArticle called for ID ${id}.`);
    try {
      const likedArticle = await likeArticleById(id);
      if (likedArticle) {
        setArticles(prevArticles => 
          prevArticles.map(a => a.id === id ? likedArticle : a)
        );
        setAllArticlesForSearch(prevAllArticles => 
          prevAllArticles.map(a => a.id === id ? likedArticle : a)
        );
      }
    } catch (error) {
      console.error("ArticleContext: Failed to like article:", error);
    }
  }, []);


  return (
    <ArticleContext.Provider value={{ 
      articles, 
      allArticlesForSearch,
      totalArticles,
      currentPage,
      totalPages,
      isLoading,
      isLoadingMore,
      fetchPage,
      getArticleBySlug, 
      addArticle, 
      updateArticle, 
      deleteArticle, 
      likeArticle,
      fetchAllArticles,
    }}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
};

