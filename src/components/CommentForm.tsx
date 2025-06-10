
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { submitComment } from '@/app/actions/commentActions';

const commentFormSchema = z.object({
  authorName: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name too long."),
  content: z.string().min(5, "Comment must be at least 5 characters.").max(1000, "Comment too long."),
});

type CommentFormData = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  articleId: string;
  onCommentAdded: () => void; // Callback to refresh comments list
}

export default function CommentForm({ articleId, onCommentAdded }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CommentFormData>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      authorName: '',
      content: '',
    }
  });

  const onSubmit: SubmitHandler<CommentFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await submitComment({
        articleId,
        authorName: data.authorName,
        content: data.content,
      });

      if (result.success) {
        toast({
          title: "Comment Submitted!",
          description: "Your comment has been posted.",
        });
        reset(); // Clear the form
        onCommentAdded(); // Trigger refresh
      } else {
        toast({
          title: "Submission Failed",
          description: result.message || "Could not post your comment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      console.error("Comment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow">
      <div>
        <Label htmlFor="authorName" className="block text-sm font-medium text-foreground">Your Name</Label>
        <Input
          id="authorName"
          {...register('authorName')}
          className="mt-1 block w-full"
          disabled={isSubmitting}
        />
        {errors.authorName && <p className="mt-1 text-sm text-destructive">{errors.authorName.message}</p>}
      </div>

      <div>
        <Label htmlFor="content" className="block text-sm font-medium text-foreground">Your Comment</Label>
        <Textarea
          id="content"
          {...register('content')}
          rows={4}
          className="mt-1 block w-full"
          disabled={isSubmitting}
        />
        {errors.content && <p className="mt-1 text-sm text-destructive">{errors.content.message}</p>}
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? 'Submitting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
}
