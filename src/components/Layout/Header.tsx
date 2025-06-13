
'use client';

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
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

const DEBOUNCE_DELAY = 500;

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const [inputValue, setInputValue] = useState('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false);
  const [currentSortOption, setCurrentSortOption] = useState<ArticleSortOption>('newest');
  const [isClient, setIsClient] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdminPage = pathname.startsWith(`/${adminSecretUrlSegment}`);
  const isHomePage = pathname === '/';
  const activeSearchQuery = searchParams.get('q');

  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setInputValue(queryFromUrl);

    const sortFromUrl = (searchParams.get('sort') as ArticleSortOption) || 'newest';
    setCurrentSortOption(sortFromUrl);

    if (queryFromUrl && !isAdminPage && !isSearchInputVisible) {
      setIsSearchInputVisible(true);
    }
  }, [searchParams, isAdminPage, isSearchInputVisible]);


  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }
      if (isHomePage) {
        router.push(`/?${params.toString()}`, { scroll: false });
      } else {
        router.push(`/?${params.toString()}`);
      }
    }, DEBOUNCE_DELAY);
  };

  const handleSearchFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmedValue = inputValue.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmedValue) {
      params.set('q', trimmedValue);
    } else {
      params.delete('q');
    }

    const currentPathWithExistingParams = `${pathname}?${searchParams.toString()}`;
    const newPathWithNewParams = `${isHomePage ? '/' : pathname}?${params.toString()}`;
    
    if (currentPathWithExistingParams !== newPathWithNewParams || !isHomePage) {
        if (isHomePage) {
            router.push(`/?${params.toString()}`, { scroll: false });
        } else {
             router.push(`/?${params.toString()}`);
        }
    }
    
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const toggleSearchInput = () => {
    const newVisibility = !isSearchInputVisible;
    setIsSearchInputVisible(newVisibility);
    if (!newVisibility && inputValue.trim()) { 
      setInputValue(''); 
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      if (isHomePage) {
        router.push(`/?${params.toString()}`, { scroll: false });
      }
    }
    if (newVisibility) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  };

 const handleSortChange = useCallback((value: string) => {
    const newSortOption = value as ArticleSortOption;
    setCurrentSortOption(newSortOption);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSortOption);
    router.push(`/?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const sortButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      disabled={!!activeSearchQuery}
      aria-label="Sort articles"
    >
      <ListFilter className="w-5 h-5" />
    </Button>
  );

  const sortDropdownContent = (
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
  );

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Cloud className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
        </Link>

        {!isAdminPage && (
          <nav className="flex items-center gap-1 sm:gap-2">
            {isSearchInputVisible && (
              <form onSubmit={handleSearchFormSubmit} className="flex items-center gap-2">
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search articles..."
                  className="w-36 sm:w-48 md:w-64 h-9"
                  value={inputValue}
                  onChange={handleSearchInputChange}
                  aria-label="Search articles input"
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

            {isHomePage &&
              (isClient ? (
                <TooltipProvider>
                  <Tooltip open={!!activeSearchQuery ? false : undefined}>
                    <TooltipTrigger asChild>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          {sortButton}
                        </DropdownMenuTrigger>
                        {sortDropdownContent}
                      </DropdownMenu>
                    </TooltipTrigger>
                    {!!activeSearchQuery && (
                      <TooltipContent side="bottom">
                        <p>Clear search to enable sorting</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ) : (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {sortButton}
                    </DropdownMenuTrigger>
                    {sortDropdownContent}
                </DropdownMenu>
              ))}
            <ThemeToggle />
          </nav>
        )}
      </div>
    </header>
  );
}
