
// IMPORTANT: This file should be placed in:
// src/app/secure-admin-zone/login/page.tsx
// AFTER you have manually renamed `src/app/admin` to `src/app/secure-admin-zone`

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {NextResponse} from 'next/server'; // Not directly used for response, but good for type hints if needed

interface LoginPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AdminLoginPage({ searchParams }: LoginPageProps) {
  const token = searchParams?.token;

  const adminLoginToken = process.env.ADMIN_LOGIN_TOKEN;
  const adminAuthCookieName = process.env.ADMIN_AUTH_COOKIE_NAME;
  const adminSecretSegment = process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT;

  if (!adminLoginToken || !adminAuthCookieName || !adminSecretSegment) {
    console.error("Admin login page: Security environment variables not set.");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-2xl font-bold text-destructive mb-4">Configuration Error</h1>
        <p className="text-muted-foreground">The admin login system is not configured correctly. Please contact the site administrator.</p>
      </div>
    );
  }

  if (token === adminLoginToken) {
    cookies().set(adminAuthCookieName, adminLoginToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });
    redirect(`/${adminSecretSegment}`);
  }

  // If token is missing or incorrect, effectively a 404 for obscurity.
  // The middleware should ideally catch this first, but this is a fallback.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist or you do not have permission to access it.</p>
    </div>
  );
}
