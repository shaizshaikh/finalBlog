// This context is not strictly necessary with server components and actions for mutations.
// However, for client-side state management of articles for display and interactions like "like",
// or if we were doing full client-side SPA style admin, it would be useful.
// For this iteration, we'll rely more on server components fetching data and server actions for mutations.
// So this file might not be used extensively or could be removed if all state is server-managed.

// For simplicity and to fulfill the "Admin Dashboard for creating and managing blog articles" on client-side for now,
// we'll keep a simplified version of client-side state management here.
// In a real app, this would be replaced by API calls and server state invalidation.

"use client";

import type { Article } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { 
  getArticles as fetchArticlesFromStore, 
  addArticle as addArticleToStore,
  updateArticle as updateArticleInStore,
  deleteArticle as deleteArticleFromStore,
  getArticleBySlug as getArticleBySlugFromStore
} from '@/lib/articlesStore'; // Using the synchronous store for now

interface ArticleContextType {
  articles: Article[];
  getArticleBySlug: (slug: string) => Article | undefined;
  addArticle: (articleData: Omit<Article, 'id' | 'createdAt' | 'likes' | 'slug'> & {slug: string}) => Promise<Article>;
  updateArticle: (article: Article) => Promise<Article | undefined>;
  deleteArticle: (id: string) => Promise<void>;
  likeArticle: (id: string) => Promise<void>;
  refreshArticles: () => void;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

export const ArticleProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<Article[]>([]);

  const refreshArticles = useCallback(() => {
    setArticles(fetchArticlesFromStore());
  }, []);
  
  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  const getArticleBySlug = useCallback((slug: string): Article | undefined => {
    return getArticleBySlugFromStore(slug);
  }, []);

  const addArticle = useCallback(async (articleData: Omit<Article, 'id' | 'createdAt' | 'likes' | 'slug'> & {slug: string}): Promise<Article> => {
    // In a real app, call an API endpoint. Here, use the store.
    const newArticle = addArticleToStore(articleData);
    refreshArticles();
    return newArticle;
  }, [refreshArticles]);

  const updateArticle = useCallback(async (article: Article): Promise<Article | undefined> => {
    const updated = updateArticleInStore(article);
    refreshArticles();
    return updated;
  }, [refreshArticles]);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    deleteArticleFromStore(id);
    refreshArticles();
  }, [refreshArticles]);
  
  const likeArticle = useCallback(async (id: string): Promise<void> => {
    const article = articles.find(a => a.id === id);
    if (article) {
      const updatedArticle = { ...article, likes: (article.likes || 0) + 1 };
      updateArticleInStore(updatedArticle);
      refreshArticles();
    }
  }, [articles, refreshArticles]);

  return (
    <ArticleContext.Provider value={{ articles, getArticleBySlug, addArticle, updateArticle, deleteArticle, likeArticle, refreshArticles }}>
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
