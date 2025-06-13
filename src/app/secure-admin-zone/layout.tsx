
"use client"; 

import { ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation'; 
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

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
