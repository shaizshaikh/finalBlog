
"use client"; 

import { ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; 
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

export const dynamic = 'force-dynamic'; // Ensure this layout is dynamically rendered

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const handleSignOut = async () => {
    await signOut({ redirect: false, callbackUrl: '/' }); 
    router.push('/'); 
  };

  if (!adminSecretUrlSegment) {
    // This can happen if the context is not yet ready or if the env var is truly missing.
    // It's a safeguard.
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p>Loading admin configuration...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-secondary text-secondary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href={`/${adminSecretUrlSegment}`} className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold font-headline">Admin Dashboard</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm hover:underline">
              Back to Site
            </Link>
            {status === "authenticated" && (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-sm">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
