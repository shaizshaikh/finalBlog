"use client";

import React from 'react';
import { ArticleProvider } from '@/contexts/ArticleContext';
import { ThemeProvider } from 'next-themes'; // For dark mode toggle if needed later

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ArticleProvider>
        {children}
      </ArticleProvider>
    </ThemeProvider>
  );
}
