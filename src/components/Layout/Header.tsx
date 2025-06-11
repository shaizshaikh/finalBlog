
"use client";

import Link from 'next/link';
import { Cloud, Search, Newspaper } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { NewsletterDialog } from '@/components/NewsletterDialog';

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const isAdminPage = pathname.startsWith('/admin');

  // Effect to synchronize the URL's 'q' parameter with the local searchQuery state
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery); // Update local state to reflect input value immediately

    if (newQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(newQuery.trim())}`);
    } else {
      // If input is cleared, navigate to homepage without query
      router.push('/');
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // This function is called on form submission (e.g., pressing Enter).
    // The URL should ideally already be up-to-date due to handleSearchInputChange.
    // This explicitly ensures navigation on submit.
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
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
                  value={searchQuery}
                  onChange={handleSearchInputChange} // Live update on change
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
