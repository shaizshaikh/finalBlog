
"use client";

import type { Article } from '@/types';
import { useArticles } from '@/contexts/ArticleContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, ExternalLink, Loader2 } from 'lucide-react'; // Added Loader2
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
import React, { useEffect } from 'react'; // Added React

export default function AdminDashboardPage() {
  const { articles, deleteArticle, refreshArticles, isLoading } = useArticles(); // Added isLoading
  const { toast } = useToast();

  // Refresh articles when the component mounts or if articles array is empty and not loading
  useEffect(() => {
    if (articles.length === 0 && !isLoading) {
      refreshArticles();
    }
  }, [articles.length, isLoading, refreshArticles]);


  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteArticle(id);
      toast({ title: 'Article Deleted', description: `"${title}" has been deleted.` });
      // refreshArticles(); // context should handle this now after delete
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete article.', variant: 'destructive' });
    }
  };
  
  if (isLoading && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading articles...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold font-headline">Manage Articles</h2>
        <Button asChild>
          <Link href="/admin/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Article
          </Link>
        </Button>
      </div>

      {articles.length === 0 && !isLoading ? ( // check !isLoading here
        <p className="text-muted-foreground text-center py-10">No articles yet. Start by creating one!</p>
      ) : (
        <div className="border rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {article.tags.slice(0,2).map(tag => <Badge key={tag} variant="outline" className="mr-1 mb-1 text-xs">{tag}</Badge>)}
                    {article.tags.length > 2 && <Badge variant="outline" className="text-xs">+{article.tags.length-2}</Badge>}
                  </TableCell>
                  <TableCell>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild title="View Article">
                      <Link href={`/articles/${article.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Edit Article">
                      <Link href={`/admin/edit/${article.slug}`}>
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Delete Article">
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
    </div>
  );
}
