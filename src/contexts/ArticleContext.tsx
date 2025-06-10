
"use client";

import type { Article } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  getArticles as fetchArticlesFromDb, 
  addArticle as addArticleToDb,
  updateArticle as updateArticleInDb,
  deleteArticle as deleteArticleFromDb,
  getArticleBySlug as getArticleBySlugFromDb,
  likeArticleById
} from '@/lib/articlesStore'; 

// Type for article data when creating via context (slug is required from form)
type ArticleContextCreationData = Omit<Article, 'id' | 'createdAt' | 'likes'>;


interface ArticleContextType {
  articles: Article[];
  getArticleBySlug: (slug: string) => Promise<Article | undefined>; // Now async
  addArticle: (articleData: ArticleContextCreationData) => Promise<Article>; // Now async
  updateArticle: (article: Article) => Promise<Article | undefined>; // Now async
  deleteArticle: (id: string) => Promise<void>; // Now async
  likeArticle: (id: string) => Promise<void>; // Now async
  refreshArticles: () => Promise<void>; // Now async
  isLoading: boolean;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const dbArticles = await fetchArticlesFromDb();
      setArticles(dbArticles);
    } catch (error) {
      console.error("Failed to refresh articles from database:", error);
      // Optionally set articles to [] or show an error state
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | undefined> => {
    // While articles are in local state, we can try to find it there first for speed,
    // but for consistency, especially if data can change, fetching from DB is better.
    // For now, let's always fetch from DB to ensure freshness.
    setIsLoading(true);
    try {
      return await getArticleBySlugFromDb(slug);
    } catch (error) {
      console.error(`Failed to get article by slug ${slug}:`, error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addArticle = useCallback(async (articleData: ArticleContextCreationData): Promise<Article> => {
    setIsLoading(true);
    try {
      const newArticle = await addArticleToDb(articleData);
      await refreshArticles(); // Refresh the list from DB
      return newArticle;
    } catch (error) {
      console.error("Failed to add article:", error);
      await refreshArticles(); // Ensure state is consistent even on error
      throw error; // Re-throw for the form to handle
    } finally {
      // setIsLoading(false); // refreshArticles will set it
    }
  }, [refreshArticles]);

  const updateArticle = useCallback(async (article: Article): Promise<Article | undefined> => {
    setIsLoading(true);
    try {
      const updated = await updateArticleInDb(article);
      await refreshArticles();
      return updated;
    } catch (error) {
      console.error("Failed to update article:", error);
      await refreshArticles();
      throw error;
    } finally {
      // setIsLoading(false);
    }
  }, [refreshArticles]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await deleteArticleFromDb(id);
      await refreshArticles();
    } catch (error) {
      console.error("Failed to delete article:", error);
      await refreshArticles();
      throw error;
    } finally {
      // setIsLoading(false);
    }
  }, [refreshArticles]);
  
  const likeArticle = useCallback(async (id: string): Promise<void> => {
    // No need to setIsLoading here as it's a quick update and refreshArticles will handle it.
    try {
      const likedArticle = await likeArticleById(id);
      if (likedArticle) {
        // Optimistically update local state or just refresh
        // For simplicity, just refresh the whole list.
        // More advanced: update only the specific article in the local 'articles' state.
        setArticles(prevArticles => 
          prevArticles.map(a => a.id === id ? likedArticle : a)
        );
      }
    } catch (error) {
      console.error("Failed to like article:", error);
      // Optionally re-fetch or handle error
    }
    // No full refreshArticles() call here to avoid a jarring page reload for a simple like.
    // The component displaying the like count might need to re-fetch or use the updated article from context.
    // For SocialShare, it's already finding the article from 'contextArticles' which should be updated.
  }, []);


  return (
    <ArticleContext.Provider value={{ 
      articles, 
      getArticleBySlug, 
      addArticle, 
      updateArticle, 
      deleteArticle, 
      likeArticle, 
      refreshArticles,
      isLoading 
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

