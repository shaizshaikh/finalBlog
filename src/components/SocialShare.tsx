
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Share2, Twitter, Facebook, Linkedin, Copy as CopyIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@/types';
import { useArticles } from '@/contexts/ArticleContext';


interface SocialShareProps {
  article: Article;
}

export default function SocialShare({ article }: SocialShareProps) {
  const { toast } = useToast();
  const [articleUrl, setArticleUrl] = useState('');
  const { likeArticle, articles: contextArticles } = useArticles(); // Use context for likes
  
  // Ensure currentArticleState reflects the latest likes from the context or the passed article
  const currentArticleState = contextArticles.find(a => a.id === article.id) || article;


  useEffect(() => {
    if (typeof window !== 'undefined') {
      setArticleUrl(window.location.href);
    }
  }, []);

  const handleLike = async () => {
    await likeArticle(article.id);
    toast({
      title: 'Liked!',
      description: `You liked "${article.title}".`,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(articleUrl);
    toast({
      title: 'Copied!',
      description: 'Article URL copied to clipboard.',
    });
  };

  const shareLink = (platformUrl: string) => {
    window.open(platformUrl.replace('{url}', encodeURIComponent(articleUrl)).replace('{title}', encodeURIComponent(article.title)), '_blank');
  };

  return (
    // Removed the outer div with border-t and border-b, and flex items-center space-x-3 mt-6 py-4
    // This component will now return a React Fragment or just the buttons directly
    // to be placed inside a flex container in the parent (ArticlePage)
    <> 
      <Button variant="outline" onClick={handleLike} className="flex items-center">
        <ThumbsUp className="w-5 h-5 mr-2 text-primary" />
        Like ({currentArticleState.likes ?? 0})
      </Button>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-accent" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this article</DialogTitle>
            <DialogDescription>
              Spread the word about "{article.title}"!
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Input defaultValue={articleUrl} readOnly />
            <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex justify-center space-x-3">
            <Button variant="ghost" size="icon" onClick={() => shareLink('https://twitter.com/intent/tweet?url={url}&text={title}')}>
              <Twitter className="w-6 h-6 text-[#1DA1F2]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shareLink('https://www.facebook.com/sharer/sharer.php?u={url}')}>
              <Facebook className="w-6 h-6 text-[#1877F2]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => shareLink('https://www.linkedin.com/shareArticle?mini=true&url={url}&title={title}')}>
              <Linkedin className="w-6 h-6 text-[#0A66C2]" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

