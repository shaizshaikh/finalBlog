
"use client";

import React from 'react';
import { ArticleProvider } from '@/contexts/ArticleContext';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ArticleProvider>
          {children}
        </ArticleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
