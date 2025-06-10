
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
  articles: Article[]; // Current page of articles
  allArticlesForSearch: Article[]; // All articles, for client-side search if needed
  totalArticles: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  isLoadingMore: boolean; // For loading subsequent pages specifically
  fetchPage: (page: number, itemsPerPage?: number) => Promise<void>;
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
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    
    try {
      const offset = (page - 1) * itemsPerPage;
      const paginatedResult = await fetchArticlesFromDb(itemsPerPage, offset);
      if (page === 1) {
        setArticles(paginatedResult.articles);
      } else {
        // For "Load More" style, append. If it's direct page navigation, replace.
        // For simplicity, let's assume direct page navigation replaces for now.
        // Or, if we implement "Load More" in the context, this should append.
        // Given current UI will use "Load More", we should append if page > 1 for that use case.
        // However, the admin page might want direct page navigation.
        // Let's make `fetchPage` always set, and `loadMore` (if added) append.
        setArticles(paginatedResult.articles);
      }
      setTotalArticles(paginatedResult.totalCount);
      setCurrentPage(paginatedResult.currentPage);
      setTotalPages(paginatedResult.totalPages);
    } catch (error) {
      console.error(`Failed to fetch page ${page} of articles:`, error);
      setArticles([]);
      setTotalArticles(0);
      setCurrentPage(1);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchAllArticles = useCallback(async () => {
    setIsLoading(true); // Can use a general loading or a specific one if needed
    try {
      const allFetchedArticles = await fetchAllArticlesFromDb();
      setAllArticlesForSearch(allFetchedArticles);
    } catch (error) {
      console.error("Failed to fetch all articles for search:", error);
      setAllArticlesForSearch([]);
    } finally {
      setIsLoading(false); // Ensure this is reset after fetching all or first page
    }
  }, []);
  
  useEffect(() => {
    const initialLoad = async () => {
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); // Load first page for general context use
      await fetchAllArticles(); // Also fetch all articles for search capabilities
    };
    initialLoad();
  }, [fetchPage, fetchAllArticles]);


  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | undefined> => {
    setIsLoading(true);
    try {
      // Try finding in the 'allArticlesForSearch' first if populated
      const foundInAll = allArticlesForSearch.find(a => a.slug === slug);
      if (foundInAll) return foundInAll;
      // Fallback to DB if not found or 'allArticlesForSearch' isn't comprehensive enough yet
      return await getArticleBySlugFromDb(slug);
    } catch (error) {
      console.error(`Failed to get article by slug ${slug}:`, error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [allArticlesForSearch]);

  const addArticle = useCallback(async (articleData: ArticleContextCreationData): Promise<Article> => {
    setIsLoading(true);
    try {
      const newArticle = await addArticleToDb(articleData);
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); // Refresh to page 1
      await fetchAllArticles(); // Refresh all articles list
      return newArticle;
    } catch (error) {
      console.error("Failed to add article:", error);
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); // Refresh current page on error
      throw error;
    } finally {
      // setIsLoading(false); // fetchPage will handle it
    }
  }, [fetchPage, fetchAllArticles, currentPage]);

  const updateArticle = useCallback(async (article: Article): Promise<Article | undefined> => {
    setIsLoading(true);
    try {
      const updated = await updateArticleInDb(article);
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); // Refresh current page
      await fetchAllArticles(); // Refresh all articles list
      return updated;
    } catch (error) {
      console.error("Failed to update article:", error);
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN); 
      throw error;
    }
  }, [fetchPage, fetchAllArticles, currentPage]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await deleteArticleFromDb(id);
      // After deletion, if current page becomes empty and it's not page 1, fetch previous page.
      // Or simply fetch page 1. For simplicity, let's fetch page 1.
      await fetchPage(1, ARTICLES_PER_PAGE_ADMIN); 
      await fetchAllArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
      await fetchPage(currentPage, ARTICLES_PER_PAGE_ADMIN);
      throw error;
    }
  }, [fetchPage, fetchAllArticles, currentPage]);
  
  const likeArticle = useCallback(async (id: string): Promise<void> => {
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
