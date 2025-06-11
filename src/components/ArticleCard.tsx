
import type { Article } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'; // Removed CardTitle import
import { Badge } from '@/components/ui/badge';
import { CalendarDays, UserCircle } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fallback for missing slug to prevent crashes, though the root cause should be fixed.
  const articleLink = article.slug ? `/articles/${article.slug}` : '#article-slug-missing';
  if (!article.slug) {
    console.warn(`ArticleCard: Article with ID ${article.id} and title "${article.title}" is missing a slug.`);
  }


  return (
    <Card className={`overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg flex w-full ${article.image_url ? 'flex-col md:flex-row' : 'flex-col'}`}>
      {article.image_url && (
        <div className="md:w-1/3 lg:w-1/4 xl:w-1/5 md:flex-shrink-0 h-48 md:h-auto"> {/* md:h-auto allows height to match content on larger screens */}
          <Link href={articleLink} className="block h-full relative"> {/* Ensure Link takes full height of this div */}
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
              className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              data-ai-hint={article.data_ai_hint || "technology abstract"}
              priority // Consider adding priority for above-the-fold images if applicable
            />
          </Link>
        </div>
      )}

      <div className={`flex flex-col flex-grow ${article.image_url ? 'md:w-2/3 lg:w-3/4 xl:w-4/5' : 'w-full'}`}>
        <CardHeader className="pt-4 md:pt-6 pb-2">
          <h2 className="text-xl font-headline mb-1 leading-tight"> {/* Changed from CardTitle to h2 */}
            <Link href={articleLink} className="hover:text-primary transition-colors">
              {article.title}
            </Link>
          </h2>
          <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center">
              <UserCircle className="w-3.5 h-3.5 mr-1" />
              <span>{article.author || 'Cloud Journal Team'}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="w-3.5 h-3.5 mr-1" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow py-2">
          <p className="text-sm text-muted-foreground">
            {article.excerpt || (article.content.length > 150 ? article.content.substring(0, 150) + '...' : article.content)}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-1.5 py-3 md:py-4 border-t">
          {article.tags.slice(0, 3).map((tag) => (
            <Link key={tag} href={`/?q=${encodeURIComponent(tag)}`} passHref>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                {tag}
              </Badge>
            </Link>
          ))}
          {article.tags.length > 3 && (
             <Link href={`/?q=${encodeURIComponent(article.tags.join(','))}`} passHref>
                <Badge variant="outline" className="text-xs px-2 py-0.5 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                +{article.tags.length - 3} more
                </Badge>
            </Link>
          )}
        </CardFooter>
      </div>
    </Card>
  );
}
