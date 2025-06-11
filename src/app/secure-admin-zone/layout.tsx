
// IMPORTANT: This file should be placed in:
// src/app/secure-admin-zone/layout.tsx
// AFTER you have manually renamed `src/app/admin` to `src/app/secure-admin-zone`

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The NEXT_PUBLIC_ prefix is essential for client-side availability.
  // However, this layout is a Server Component, so process.env can be used directly
  // if the var is not prefixed with NEXT_PUBLIC_.
  // For consistency and if any part of this layout might become client-side later,
  // using NEXT_PUBLIC_ for URL construction is safer.
  // But for just the header text, it's fine.
  // The actual redirection/link generation to admin pages should use the env var.

  return (
    <div className="min-h-screen">
      <header className="bg-secondary text-secondary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          {/* Link to the admin root using the environment variable */}
          <Link href={`/${process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT || 'admin'}`} className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold font-headline">Admin Dashboard</h1>
          </Link>
          <Link href="/" className="text-sm hover:underline">
            Back to Site
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
