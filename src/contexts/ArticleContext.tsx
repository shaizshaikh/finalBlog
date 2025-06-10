
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
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load of context (first page + all articles)
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false); // For "load more" in admin

  const fetchPage = useCallback(async (page: number, itemsPerPage: number = ARTICLES_PER_PAGE_ADMIN) => {
    if (page === 1) setIsLoading(true); // This isLoading might be redundant if initialLoad sets it
    else setIsLoadingMore(true);
    
    try {
      const offset = (page - 1) * itemsPerPage;
      const paginatedResult = await fetchArticlesFromDb(itemsPerPage, offset);
      
      if (page === 1) {
        setArticles(paginatedResult.articles);
      } else {
        // Append for "Load More" functionality
        setArticles(prevArticles => [...prevArticles, ...paginatedResult.articles]);
      }
      setTotalArticles(paginatedResult.totalCount);
      setCurrentPage(paginatedResult.currentPage); // This is an API provided current page
      setTotalPages(paginatedResult.totalPages);
    } catch (error) {
      console.error(`Failed to fetch page ${page} of articles for context:`, error);
      // Don't reset articles if it's a subsequent load error, to keep existing data
      if (page === 1) {
        setArticles([]);
        setTotalArticles(0);
        setCurrentPage(1);
        setTotalPages(0);
      }
    } finally {
      if (page === 1) setIsLoading(false); // Handled by initialLoad usually
      else setIsLoadingMore(false);
    }
  }, []);

  const fetchAllArticles = useCallback(async () => {
    // This specific loading state might not be needed if combined with general isLoading
    // For now, let's assume initialLoad's isLoading covers this.
    try {
      const allFetchedArticles = await fetchAllArticlesFromDb();
      setAllArticlesForSearch(allFetchedArticles);
    } catch (error) {
      console.error("Failed to fetch all articles for search:", error);
      setAllArticlesForSearch([]);
    }
  }, []);
  
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchPage(1, ARTICLES_PER_PAGE_ADMIN), // Load first page for admin context
          fetchAllArticles() // Fetch all articles for search capabilities
        ]);
      } catch(error) {
        console.error("Error during initial load of ArticleContext:", error);
        // Handle error state if needed, e.g. set an error flag
      } finally {
        setIsLoading(false);
      }
    };
    initialLoad();
  // fetchPage and fetchAllArticles are memoized with useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | undefined> => {
    // setIsLoading(true); // Avoid global loading for this, can be too disruptive
    try {
      const foundInAll = allArticlesForSearch.find(a => a.slug === slug);
      if (foundInAll) return foundInAll;
      return await getArticleBySlugFromDb(slug);
    } catch (error) {
      console.error(`Failed to get article by slug ${slug}:`, error);
      return undefined;
    } finally {
      // setIsLoading(false);
    }
  }, [allArticlesForSearch]);

  const addArticle = useCallback(async (articleData: ArticleContextCreationData): Promise<Article> => {
    // Consider a specific loading state for this action if it's disruptive
    try {
      const newArticle = await addArticleToDb(articleData);
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); // Refresh admin to page 1
      await fetchAllArticles(); // Refresh all articles list
      return newArticle;
    } catch (error) {
      console.error("Failed to add article:", error);
      // Potentially refresh current page on error if that's desired
      // await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); 
      throw error;
    }
  }, [fetchPage, fetchAllArticles]);

  const updateArticle = useCallback(async (article: Article): Promise<Article | undefined> => {
    try {
      const updated = await updateArticleInDb(article);
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); // Refresh admin current page
      await fetchAllArticles(); // Refresh all articles list
      return updated;
    } catch (error) {
      console.error("Failed to update article:", error);
      // await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); 
      throw error;
    }
  }, [fetchPage, fetchAllArticles, currentPage]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteArticleFromDb(id);
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); 
      await fetchAllArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
      // await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN);
      throw error;
    }
  }, [fetchPage, fetchAllArticles]);
  
  const likeArticle = useCallback(async (id: string): Promise<void> => {
    try {
      const likedArticle = await likeArticleById(id);
      if (likedArticle) {
        // Update admin articles list if the liked article is present
        setArticles(prevArticles => 
          prevArticles.map(a => a.id === id ? likedArticle : a)
        );
        // Always update allArticlesForSearch as it's the comprehensive list
        setAllArticlesForSearch(prevAllArticles => 
          prevAllArticles.map(a => a.id === id ? likedArticle : a)
        );
      }
    } catch (error) {
      console.error("Failed to like article:", error);
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

