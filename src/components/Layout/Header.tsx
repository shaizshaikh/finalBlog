
"use client";

import Link from 'next/link';
import { Cloud, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';

const DEBOUNCE_DELAY = 500; // milliseconds

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [inputValue, setInputValue] = useState('');
  // debouncedInputValue is what's actually used to trigger navigation
  const [debouncedInputValue, setDebouncedInputValue] = useState(''); 
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false);

  const isAdminPage = pathname.startsWith('/admin');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to sync URL query to input field and debounced value on initial load or direct URL change
  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setInputValue(queryFromUrl);
    setDebouncedInputValue(queryFromUrl); 
    if (queryFromUrl && !isAdminPage) { // Show search if query exists and not on admin page
      setIsSearchInputVisible(true);
    } else if (!queryFromUrl && isSearchInputVisible && !isAdminPage) {
      // If URL query is cleared and search was visible (and not admin), keep it visible or hide it based on preference
      // For now, let's keep it visible if user was interacting with it. Can be changed.
    } else if (isAdminPage) {
      setIsSearchInputVisible(false); // Always hide on admin pages initially
    }
  }, [searchParams, isAdminPage, isSearchInputVisible]);


  // Effect to debounce inputValue and update debouncedInputValue
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
  }, [inputValue, DEBOUNCE_DELAY]);


  // Effect to navigate when debouncedInputValue changes
  useEffect(() => {
    const currentUrlQuery = searchParams.get('q') || '';
    // Only navigate if debounced value is different and not on an admin page
    if (debouncedInputValue !== currentUrlQuery && !isAdminPage) {
      if (debouncedInputValue.trim()) {
        router.push(`/?q=${encodeURIComponent(debouncedInputValue.trim())}`);
      } else if (pathname ==='/') { 
        router.push('/');
      }
    }
  }, [debouncedInputValue, router, searchParams, pathname, isAdminPage]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); 
  };

  // Handles "Enter" key press in the form
  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); // Clear any pending debounce
    setDebouncedInputValue(inputValue); // Immediately set debounced value to trigger navigation
    
    // The useEffect listening to debouncedInputValue will handle the navigation
  };

  const toggleSearchInput = () => {
    const newVisibility = !isSearchInputVisible;
    setIsSearchInputVisible(newVisibility);
    if (!newVisibility && inputValue.trim()) { // If hiding and there was a search term
      setInputValue(''); // This will trigger the debounce effect to clear the query
    }
  };
  
  // Don't render search elements if on admin page
  if (isAdminPage) {
    return (
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Cloud className="w-8 h-8" />
            <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
          </Link>
          {/* No nav items needed here for admin, as AdminLayout provides "Back to Site" */}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Cloud className="w-8 h-8" />
          <h1 className="text-2xl font-headline font-semibold">Cloud Journal</h1>
        </Link>
        
        <nav className="flex items-center gap-2 sm:gap-4">
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
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9" 
            onClick={toggleSearchInput}
            aria-label={isSearchInputVisible ? "Hide search bar" : "Show search bar"}
          >
            {isSearchInputVisible ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </Button>
          
          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">Admin</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

