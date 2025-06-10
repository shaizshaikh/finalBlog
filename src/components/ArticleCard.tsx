import type { Article } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, UserCircle } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <Link href={`/articles/${article.slug}`} className="block">
        {article.imageUrl && (
          <div className="relative w-full h-48">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={article.dataAiHint || "technology abstract"}
            />
          </div>
        )}
      </Link>
      <CardHeader>
        <Link href={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
          <CardTitle className="text-xl font-headline mb-2">{article.title}</CardTitle>
        </Link>
        <div className="text-xs text-muted-foreground flex items-center space-x-4">
          <div className="flex items-center">
            <UserCircle className="w-4 h-4 mr-1" />
            <span>{article.author || 'Cloud Journal Team'}</span>
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground mb-3">{article.excerpt || article.content.substring(0, 150) + '...'}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        {article.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
        {article.tags.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{article.tags.length - 3} more
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
