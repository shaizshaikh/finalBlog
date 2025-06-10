
import type { Comment } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (!comments || comments.length === 0) {
    // This state will be handled by the parent component (ArticlePage)
    // to show "Be the first to comment" or loading states.
    return null;
  }

  return (
    <div className="space-y-6 mt-8">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-4 p-4 bg-card rounded-lg shadow">
          <Avatar>
            {/* Placeholder for user image - could be dynamic in future */}
            {/* <AvatarImage src={`https://i.pravatar.cc/40?u=${comment.author_name}`} alt={comment.author_name} /> */}
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
          </div>
        </div>
      ))}
    </div>
  );
}
