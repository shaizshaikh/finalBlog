
"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, ShieldAlert } from 'lucide-react';
import { useRuntimeConfig } from '@/contexts/RuntimeConfigContext';

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginClientForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { adminSecretUrlSegment } = useRuntimeConfig();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (status === "authenticated" && adminSecretUrlSegment) {
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith(window.location.origin)) {
        router.replace(callbackUrl);
      } else {
        router.replace(`/${adminSecretUrlSegment}`);
      }
    }
  }, [status, router, adminSecretUrlSegment, searchParams]);

  // This loader is if the page itself is loading, not the auth status check.
  // The Suspense fallback in the page container will handle initial page load suspense.
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="sr-only">Checking session status...</p>
      </div>
    );
  }
  
  if (!adminSecretUrlSegment) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold text-destructive mb-4">Configuration Error</h1>
          <p className="text-muted-foreground">Admin URL context is not available. Please ensure ADMIN_SECRET_URL_SEGMENT is configured.</p>
        </div>
      );
  }

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const callbackUrlFromParams = searchParams.get('callbackUrl');
      const result = await signIn('credentials', {
        redirect: false, 
        username: data.username,
        password: data.password,
        callbackUrl: callbackUrlFromParams || `/${adminSecretUrlSegment}`,
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid username or password." : "Login failed. Please try again.");
        console.error("Sign-in error:", result.error);
      } else if (result?.ok && result.url) {
        // Let useEffect handle redirect
      } else if (result?.ok && !result.url) {
        // Let useEffect handle redirect if session status changes
      }
       else {
        setError("An unexpected error occurred during sign-in.");
      }
    } catch (e) {
      console.error("Submit error:", e);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold font-headline">Admin Portal</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-sm flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your_username"
                {...register('username')}
                disabled={loading}
                autoFocus
              />
              {errors.username && <p className="text-sm text-destructive mt-1">{errors.username.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={loading}
              />
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-xs text-center text-muted-foreground pt-4">
            <p>This is a restricted area. Authorized personnel only.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

