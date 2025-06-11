
"use client";

import Link from 'next/link';
import { Cloud, Search, X, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { ArticleSortOption } from '@/lib/articlesStore';

const DEBOUNCE_DELAY = 500;

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue, setDebouncedInputValue] = useState(''); 
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false);
  const [currentSortOption, setCurrentSortOption] = useState<ArticleSortOption>('newest');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdminPage = pathname.startsWith('/admin');
  const isHomePage = pathname === '/';
  const activeSearchQuery = searchParams.get('q');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setInputValue(queryFromUrl);
    setDebouncedInputValue(queryFromUrl);

    const sortFromUrl = (searchParams.get('sort') as ArticleSortOption) || 'newest';
    setCurrentSortOption(sortFromUrl);

    if (queryFromUrl && !isAdminPage) {
      setIsSearchInputVisible(true);
    } else if (isAdminPage && isSearchInputVisible) {
      // Hide search if navigating to admin page and it was visible
      setIsSearchInputVisible(false);
    }
  }, [searchParams, isAdminPage, isSearchInputVisible]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  useEffect(() => {
    const currentUrlQuery = searchParams.get('q') || '';
    if (debouncedInputValue !== currentUrlQuery && !isAdminPage) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedInputValue.trim()) {
        params.set('q', debouncedInputValue.trim());
      } else {
        params.delete('q');
      }
      const sortParam = searchParams.get('sort');
      if (sortParam) {
        params.set('sort', sortParam);
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [debouncedInputValue, router, searchParams, pathname, isAdminPage]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); 
  };

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setDebouncedInputValue(inputValue); 
  };

  const toggleSearchInput = () => {
    const newVisibility = !isSearchInputVisible;
    setIsSearchInputVisible(newVisibility);
    if (!newVisibility && inputValue.trim()) { 
      setInputValue(''); 
      setDebouncedInputValue(''); 
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      const sortParam = searchParams.get('sort');
      if (sortParam) {
        params.set('sort', sortParam);
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const handleSortChange = (value: string) => {
    const newSortOption = value as ArticleSortOption;
    setCurrentSortOption(newSortOption);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSortOption);
    if (activeSearchQuery) {
      params.set('q', activeSearchQuery);
    } else {
      params.delete('q'); // Ensure 'q' is not present if search is not active
    }
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const sortButtonAndDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          disabled={!!activeSearchQuery}
          aria-label="Sort articles"
        >
          <ListFilter className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Sort Articles By</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentSortOption} onValueChange={handleSortChange}>
          <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title-asc">Title (A-Z)</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="title-desc">Title (Z-A)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={isAdminPage ? "/" : "/"} className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Cloud className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
        </Link>
        
        {!isAdminPage && (
          <nav className="flex items-center gap-1 sm:gap-2">
            {isSearchInputVisible && (
              <form onSubmit={handleSearchFormSubmit} className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="w-36 sm:w-48 md:w-64 h-9"
                  value={inputValue}
                  onChange={handleSearchInputChange}
                  autoFocus
                />
              </form>
            )}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9" 
              onClick={toggleSearchInput}
              aria-label={isSearchInputVisible ? "Hide search bar" : "Show search bar"}
            >
              {isSearchInputVisible ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            
            {isHomePage && (
              isClient ? (
                <TooltipProvider>
                  <Tooltip open={!!activeSearchQuery ? false : undefined}>
                    <TooltipTrigger asChild>
                      {sortButtonAndDropdown}
                    </TooltipTrigger>
                    {!!activeSearchQuery && (
                      <TooltipContent side="bottom">
                        <p>Clear search to enable sorting</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ) : (
                sortButtonAndDropdown // Render without Tooltip on SSR
              )
            )}
            
            <Link href="/admin">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-9 px-2 md:px-3">Admin</Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
