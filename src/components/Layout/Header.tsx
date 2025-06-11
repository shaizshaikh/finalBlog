
"use client";

import Link from 'next/link';
import { Cloud, Search, Newspaper } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { NewsletterDialog } from '@/components/NewsletterDialog';

const DEBOUNCE_DELAY = 500; // milliseconds

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Local state for the input field, updates immediately
  const [inputValue, setInputValue] = useState('');
  // State that triggers navigation, updated after debounce
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const isAdminPage = pathname.startsWith('/admin');

  // Effect to synchronize URL's 'q' parameter with inputValue and debouncedSearchQuery on initial load or external URL change
  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setInputValue(queryFromUrl);
    setDebouncedSearchQuery(queryFromUrl); 
  }, [searchParams]);

  // Debounce effect for inputValue changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(inputValue);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  // Effect to navigate when debouncedSearchQuery changes
  useEffect(() => {
    // Only navigate if the debounced query is different from the current URL query
    // or if we are clearing the search. This avoids redundant navigations.
    const currentUrlQuery = searchParams.get('q') || '';
    if (debouncedSearchQuery !== currentUrlQuery) {
      if (debouncedSearchQuery.trim()) {
        router.push(`/?q=${encodeURIComponent(debouncedSearchQuery.trim())}`);
      } else if (currentUrlQuery) { 
        // If debounced query is empty AND there was a query in URL, go to home
        router.push('/');
      }
    }
  }, [debouncedSearchQuery, router, searchParams]);


  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); // Update input value immediately
  };

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // On explicit submit, bypass debounce and navigate immediately
    const currentInputValue = inputValue.trim();
    const currentUrlQuery = searchParams.get('q') || '';
    if (currentInputValue !== currentUrlQuery) { // Only push if different
        if (currentInputValue) {
            router.push(`/?q=${encodeURIComponent(currentInputValue)}`);
        } else {
            router.push('/');
        }
    }
    setDebouncedSearchQuery(currentInputValue); // Ensure debounced state matches
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Cloud className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
        </Link>
        
        <nav className="flex items-center gap-4">
          {!isAdminPage && (
            <>
              <form onSubmit={handleSearchFormSubmit} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="w-64 h-9"
                  value={inputValue} // Controlled by inputValue
                  onChange={handleSearchInputChange}
                />
                <Button type="submit" variant="outline" size="icon" className="h-9 w-9">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
              <NewsletterDialog>
                <Button variant="ghost">
                  <Newspaper className="mr-2 h-5 w-5 text-accent" />
                  Subscribe
                </Button>
              </NewsletterDialog>
            </>
          )}
          
          {!isAdminPage && (
            <Link href="/admin">
              <Button variant="outline">Admin Dashboard</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
