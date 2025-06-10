"use client";

import React, { useState, useEffect } from 'react';
import { detectAndCopyCodeSnippet, type DetectAndCopyCodeSnippetInput, type DetectAndCopyCodeSnippetOutput } from '@/ai/flows/find-code-snippet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Code2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface FeaturedCodeSnippetProps {
  articleContent: string; // Markdown content of the article
}

const FeaturedCodeSnippet: React.FC<FeaturedCodeSnippetProps> = ({ articleContent }) => {
  const [snippetData, setSnippetData] = useState<DetectAndCopyCodeSnippetOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSnippet = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const input: DetectAndCopyCodeSnippetInput = { articleText: articleContent };
        const result = await detectAndCopyCodeSnippet(input);
        setSnippetData(result);
      } catch (err) {
        console.error("Failed to detect code snippet:", err);
        setError("Could not analyze article for code snippets.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSnippet();
  }, [articleContent]);

  const handleCopy = () => {
    if (snippetData?.codeSnippet) {
      navigator.clipboard.writeText(snippetData.codeSnippet);
      toast({
        title: 'Copied!',
        description: 'Featured code snippet copied to clipboard.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center my-6 p-4 border rounded-md">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Analyzing for featured code snippet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <Code2 className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!snippetData?.hasCodeSnippet || !snippetData.codeSnippet) {
    return null; // No featured snippet or AI decided not to feature one
  }

  return (
    <Card className="my-8 bg-secondary/50 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Code2 className="w-6 h-6 mr-2 text-primary" />
          Featured Code Snippet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-card p-4 rounded-md border">
          <pre className="whitespace-pre-wrap break-all text-sm font-code">
            <code>{snippetData.codeSnippet}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            aria-label="Copy featured code snippet"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedCodeSnippet;
