
"use client";

import type { Article } from '@/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useArticles } from '@/contexts/ArticleContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { generateSlugURL } from '@/ai/flows/generate-slug-url';
import { generateTags as generateTagsAI } from '@/ai/flows/generate-tags';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Wand2, TagsIcon } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer'; 
import { sendNewArticleNotification } from '@/app/actions/newsletterActions';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

const articleSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  tags: z.string().min(1, 'At least one tag is required'), 
  author: z.string().min(2, 'Author name is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  excerpt: z.string().max(300, "Excerpt too long").optional(),
  dataAiHint: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface AdminArticleFormProps {
  article?: Article; 
}

export default function AdminArticleForm({ article }: AdminArticleFormProps) {
  const { addArticle, updateArticle } = useArticles();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugLoading, setIsSlugLoading] = useState(false);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const { control, handleSubmit, register, setValue, watch, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: article?.title || '',
      content: article?.content || '',
      slug: article?.slug || '',
      tags: article?.tags.join(', ') || '',
      author: article?.author || 'Cloud Journal Admin',
      imageUrl: article?.image_url || '',
      excerpt: article?.excerpt || '',
      dataAiHint: article?.data_ai_hint || '',
    },
  });

  const articleContent = watch('content');
  const articleTitle = watch('title');

  const handleGenerateSlug = useCallback(async () => {
    if (!articleTitle) {
      toast({ title: 'Title required', description: 'Please enter a title to generate a slug.', variant: 'destructive' });
      return;
    }
    setIsSlugLoading(true);
    try {
      const result = await generateSlugURL({ title: articleTitle });
      if (result.slug) {
        setValue('slug', result.slug, { shouldValidate: true });
        toast({ title: 'Slug Generated!', description: `Slug "${result.slug}" created.` });
      }
    } catch (error) {
      console.error('Failed to generate slug:', error);
      toast({ title: 'Error', description: 'Could not generate slug.', variant: 'destructive' });
    } finally {
      setIsSlugLoading(false);
    }
  }, [articleTitle, setValue, toast]);
  
  const handleGenerateTags = useCallback(async () => {
    if (!articleContent) {
      toast({ title: 'Content required', description: 'Please enter some content to generate tags.', variant: 'destructive' });
      return;
    }
    setIsTagsLoading(true);
    try {
      const result = await generateTagsAI({ content: articleContent });
      if (result.tags && result.tags.length > 0) {
        setValue('tags', result.tags.join(', '), { shouldValidate: true });
        toast({ title: 'Tags Generated!', description: `Suggested tags: ${result.tags.join(', ')}` });
      } else {
        toast({ title: 'No Tags Generated', description: `AI could not suggest tags for this content.` });
      }
    } catch (error) {
      console.error('Failed to generate tags:', error);
      toast({ title: 'Error', description: 'Could not generate tags.', variant: 'destructive' });
    } finally {
      setIsTagsLoading(false);
    }
  }, [articleContent, setValue, toast]);


  const onSubmit = async (data: ArticleFormData) => {
    setIsSubmitting(true);
    const articleDataForStore = {
      ...data,
      tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      image_url: data.imageUrl // ensure image_url is passed
    };

    try {
      if (article) { 
        await updateArticle({ ...article, ...articleDataForStore });
        toast({ title: 'Article Updated', description: `"${data.title}" has been updated.` });
      } else { 
        const newArticle = await addArticle(articleDataForStore); 
        toast({ title: 'Article Created', description: `"${newArticle.title}" has been published.` });
        
        if (newArticle && newArticle.id) { 
            await sendNewArticleNotification(newArticle);
            toast({ title: 'Newsletter Sent', description: `Notification for "${newArticle.title}" sent to subscribers.` });
        } else {
            console.error('AdminArticleForm: newArticle object is invalid or missing ID after creation.');
            toast({ title: 'Notification Error', description: 'Could not send newsletter: article data incomplete.', variant: 'destructive'});
        }
      }
      if (adminSecretUrlSegment) {
        router.push(`/${adminSecretUrlSegment}`); 
      } else {
        console.error("AdminArticleForm: adminSecretUrlSegment is not available for redirect.");
        router.push('/'); // Fallback redirect
      }
    } catch (error) {
      console.error('AdminArticleForm: Failed to save article:', error);
      toast({ title: 'Error saving article', description: (error instanceof Error ? error.message : 'An unknown error occurred.'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} className="mt-1" />
        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea id="content" {...register('content')} rows={15} className="mt-1 font-code" />
          {errors.content && <p className="text-destructive text-sm mt-1">{errors.content.message}</p>}
        </div>
        <div>
          <Label>HTML Preview</Label>
          <div className="mt-1 border rounded-md p-4 h-[340px] overflow-y-auto bg-muted/30">
            {articleContent ? <MarkdownRenderer content={articleContent} /> : <p className="text-muted-foreground text-sm">Start typing markdown to see a preview...</p>}
          </div>
        </div>
      </div>


      <div>
        <Label htmlFor="slug">Slug</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input id="slug" {...register('slug')} />
          <Button type="button" variant="outline" onClick={handleGenerateSlug} disabled={isSlugLoading || !articleTitle}>
            {isSlugLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4"/>}
            <span className="ml-2 hidden sm:inline">Generate</span>
          </Button>
        </div>
        {errors.slug && <p className="text-destructive text-sm mt-1">{errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <div className="flex items-center gap-2 mt-1">
        <Input id="tags" {...register('tags')} />
        <Button type="button" variant="outline" onClick={handleGenerateTags} disabled={isTagsLoading || !articleContent}>
            {isTagsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TagsIcon className="h-4 w-4"/>}
            <span className="ml-2 hidden sm:inline">Suggest</span>
          </Button>
        </div>
        {errors.tags && <p className="text-destructive text-sm mt-1">{errors.tags.message}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="author">Author</Label>
          <Input id="author" {...register('author')} className="mt-1" />
          {errors.author && <p className="text-destructive text-sm mt-1">{errors.author.message}</p>}
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL (e.g., https://placehold.co/800x400.png)</Label>
          <Input id="imageUrl" {...register('imageUrl')} className="mt-1" />
          {errors.imageUrl && <p className="text-destructive text-sm mt-1">{errors.imageUrl.message}</p>}
        </div>
      </div>
      
      <div>
        <Label htmlFor="dataAiHint">Image AI Hint (1-2 keywords for placeholder, e.g. "cloud abstract")</Label>
        <Input id="dataAiHint" {...register('dataAiHint')} className="mt-1" />
        {errors.dataAiHint && <p className="text-destructive text-sm mt-1">{errors.dataAiHint.message}</p>}
      </div>

      <div>
          <Label htmlFor="excerpt">Excerpt (Short summary for article cards)</Label>
          <Textarea id="excerpt" {...register('excerpt')} rows={3} className="mt-1" />
          {errors.excerpt && <p className="text-destructive text-sm mt-1">{errors.excerpt.message}</p>}
      </div>


      <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        {article ? 'Update Article' : 'Create Article'}
      </Button>
    </form>
  );
}
