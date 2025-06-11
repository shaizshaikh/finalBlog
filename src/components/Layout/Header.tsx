
"use client";

import Link from 'next/link';
import { Cloud, Search, Newspaper, X } from 'lucide-react';
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
  
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false); // New state for visibility

  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setInputValue(queryFromUrl);
    setDebouncedSearchQuery(queryFromUrl);
    // If there's a query in the URL, make the search input visible
    if (queryFromUrl) {
      setIsSearchInputVisible(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(inputValue);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, DEBOUNCE_DELAY]);

  useEffect(() => {
    const currentUrlQuery = searchParams.get('q') || '';
    if (debouncedSearchQuery !== currentUrlQuery) {
      if (debouncedSearchQuery.trim()) {
        router.push(`/?q=${encodeURIComponent(debouncedSearchQuery.trim())}`);
      } else if (currentUrlQuery && pathname ==='/') { 
        router.push('/');
      }
    }
  }, [debouncedSearchQuery, router, searchParams, pathname]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); 
  };

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentInputValue = inputValue.trim();
    const currentUrlQuery = searchParams.get('q') || '';
    if (currentInputValue !== currentUrlQuery) {
        if (currentInputValue) {
            router.push(`/?q=${encodeURIComponent(currentInputValue)}`);
        } else if (pathname === '/') {
            router.push('/');
        }
    }
    setDebouncedSearchQuery(currentInputValue);
  };

  const toggleSearchInput = () => {
    setIsSearchInputVisible(prev => !prev);
    // If we are hiding the search bar and it has content, clear the search
    if (isSearchInputVisible && inputValue.trim()) {
      setInputValue(''); // This will trigger the debounce effect to clear the query
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Cloud className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          {!isAdminPage && (
            <>
              {isSearchInputVisible && (
                <form onSubmit={handleSearchFormSubmit} className="flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder="Search articles..."
                    className="w-40 sm:w-64 h-9"
                    value={inputValue}
                    onChange={handleSearchInputChange}
                    autoFocus
                  />
                </form>
              )}
              <Button 
                type="button" // Changed from submit
                variant="ghost" 
                size="icon" 
                className="h-9 w-9" 
                onClick={toggleSearchInput}
                aria-label={isSearchInputVisible ? "Hide search bar" : "Show search bar"}
              >
                {isSearchInputVisible ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </Button>
              <NewsletterDialog>
                <Button variant="ghost" className="hidden sm:inline-flex">
                  <Newspaper className="mr-2 h-5 w-5 text-accent" />
                  Subscribe
                </Button>
              </NewsletterDialog>
               <NewsletterDialog>
                <Button variant="ghost" size="icon" className="sm:hidden inline-flex h-9 w-9">
                  <Newspaper className="h-5 w-5 text-accent" />
                </Button>
              </NewsletterDialog>
            </>
          )}
          
          {!isAdminPage && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">Admin</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
