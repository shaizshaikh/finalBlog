
// IMPORTANT: This file should be placed in:
// src/app/secure-admin-zone/page.tsx
// AFTER you have manually renamed `src/app/admin` to `src/app/secure-admin-zone`

"use client";

import type { Article } from '@/types';
import { useArticles } from '@/contexts/ArticleContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Trash2, Loader2, FilterX, Search, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import React, { useState, useMemo, useEffect } from 'react';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

type SortOption = "newest" | "oldest" | "title-asc" | "title-desc";
const ADMIN_SEARCH_DEBOUNCE_DELAY = 500;

export default function AdminDashboardPage() {
  const {
    articles,
    deleteArticle,
    isLoading: isContextLoading,
    isLoadingMore,
    fetchPage,
    currentPage,
    totalPages,
    totalArticles
  } = useArticles();
  const { toast } = useToast();
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const [searchTermInput, setSearchTermInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isAdminSearchVisible, setIsAdminSearchVisible] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTermInput);
    }, ADMIN_SEARCH_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTermInput]);

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteArticle(id);
      toast({ title: 'Article Deleted', description: `"${title}" has been deleted.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete article.', variant: 'destructive' });
    }
  };

  const filteredAndSortedArticles = useMemo(() => {
    let processedArticles = [...articles];

    if (debouncedSearchTerm.trim() !== "") {
      processedArticles = processedArticles.filter(article =>
        article.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        article.author.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    switch (sortOption) {
      case "newest":
        processedArticles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        processedArticles.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "title-asc":
        processedArticles.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        processedArticles.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
    return processedArticles;
  }, [articles, debouncedSearchTerm, sortOption]);

  const toggleAdminSearch = () => {
    setIsAdminSearchVisible(prev => {
      if (prev && searchTermInput.trim()) { 
        setSearchTermInput(''); 
      }
      return !prev;
    });
  };


  if (isContextLoading && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold font-headline">Manage Articles ({totalArticles})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleAdminSearch}
            aria-label={isAdminSearchVisible ? "Hide search and sort controls" : "Show search and sort controls"}
          >
            {isAdminSearchVisible ? <XIcon className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
          <Button asChild>
            <Link href={`/${adminSecretUrlSegment}/create`}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Article
            </Link>
          </Button>
        </div>
      </div>

      {isAdminSearchVisible && (
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-card border rounded-lg shadow-sm">
          <Input
            placeholder="Search articles (title, author, tags)..."
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            className="flex-grow"
            autoFocus
            aria-label="Search articles in admin dashboard"
          />
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[200px]" aria-label="Sort articles by">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Sort: Newest First</SelectItem>
              <SelectItem value="oldest">Sort: Oldest First</SelectItem>
              <SelectItem value="title-asc">Sort: Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Sort: Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!isContextLoading && articles.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No articles yet. Start by creating one!</p>
      ) : filteredAndSortedArticles.length === 0 && debouncedSearchTerm ? (
        <div className="text-center py-10">
            <FilterX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No articles match your search criteria for "{debouncedSearchTerm}".</p>
        </div>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[250px] w-[40%]">Title</TableHead>
                <TableHead className="min-w-[120px]">Author</TableHead>
                <TableHead className="min-w-[150px]">Tags</TableHead>
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="text-right min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {article.tags.slice(0,2).map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1 text-xs">{tag}</Badge>)}
                    {article.tags.length > 2 && <Badge variant="outline" className="text-xs">+{article.tags.length-2}</Badge>}
                  </TableCell>
                  <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild title="Edit Article" aria-label={`Edit article: ${article.title}`}>
                      <Link href={`/${adminSecretUrlSegment}/edit/${article.slug}`}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Delete Article" aria-label={`Delete article: ${article.title}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the article "{article.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(article.id, article.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isContextLoading && articles.length > 0 && currentPage < totalPages && !debouncedSearchTerm && (
        <div className="text-center mt-8">
          <Button
            onClick={() => fetchPage(currentPage + 1)}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoadingMore ? 'Loading...' : 'Load More Articles'}
          </Button>
        </div>
      )}
      {debouncedSearchTerm && articles.length > 0 && filteredAndSortedArticles.length > 0 && currentPage < totalPages && (
         <p className="text-sm text-muted-foreground text-center mt-4">
            Searching and sorting is applied to currently loaded articles.
            <Button variant="link" onClick={() => { setSearchTermInput(""); setIsAdminSearchVisible(false); }} className="p-1">Clear search</Button> to see all articles and load more.
        </p>
      )}
    </div>
  );
}
