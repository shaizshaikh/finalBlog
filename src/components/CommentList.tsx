
"use client";

import type { Comment } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, UserCircle } from 'lucide-react';
import { likeComment as likeCommentAction } from '@/app/actions/commentActions';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';

interface CommentListProps {
  initialComments: Comment[]; // Changed from `comments` to `initialComments`
  onCommentLiked?: (updatedComment: Comment) => void; // Optional callback
}

export default function CommentList({ initialComments, onCommentLiked }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const { toast } = useToast();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  if (!comments || comments.length === 0) {
    return null;
  }

  const handleLikeComment = async (commentId: string) => {
    const result = await likeCommentAction(commentId);
    if (result.success && result.updatedComment) {
      setComments(prevComments =>
        prevComments.map(c => (c.id === commentId ? result.updatedComment! : c))
      );
      if (onCommentLiked) {
        onCommentLiked(result.updatedComment);
      }
      toast({
        title: "Comment Liked!",
        description: "Thanks for the feedback.",
      });
    } else {
      toast({
        title: "Error",
        description: result.message || "Could not like comment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-4 p-4 bg-card rounded-lg shadow">
          <Avatar>
            <AvatarFallback>
              <UserCircle className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line">{comment.content}</p>
            <div className="mt-2 flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleLikeComment(comment.id)}
                className="text-muted-foreground hover:text-primary p-1 h-auto"
              >
                <ThumbsUp className="w-4 h-4 mr-1.5" />
                ({comment.likes})
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
