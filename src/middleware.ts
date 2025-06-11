
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl; // Added search

  const adminSecretSegment = process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!adminSecretSegment || !nextAuthSecret) {
    console.error('Middleware: Security environment variables (ADMIN_SECRET_URL_SEGMENT or NEXTAUTH_SECRET) are not set!');
    if (pathname.startsWith(`/${adminSecretSegment || 'default-admin-placeholder'}`)) { // Added default placeholder to avoid breaking if undefined
         return new Response('Server configuration error.', { status: 500 });
    }
    return NextResponse.next();
  }

  const session = await getToken({ req: request, secret: nextAuthSecret });

  const isAdminPath = pathname.startsWith(`/${adminSecretSegment}`);
  const isLoginPage = pathname === `/${adminSecretSegment}/login`;
  const isAuthApiRoute = pathname.startsWith('/api/auth');

  const physicalAdminPathPattern = /^\/secure-admin-zone(\/.*)?$/;

  // 1. Block direct access to the physical admin directory (except for login rewrite)
  if (physicalAdminPathPattern.test(pathname) && pathname !== '/secure-admin-zone/login') {
    const isInternalRewriteToLogin = request.headers.get('x-middleware-rewrite')?.includes('/secure-admin-zone/login');
    const isInternalRewriteToAdmin = request.headers.get('x-middleware-rewrite')?.includes('/secure-admin-zone');
    
    // Allow if it's a rewrite to an admin page (which implies session was checked)
    // OR if it's a rewrite specifically to the login page.
    if (isInternalRewriteToAdmin && !isInternalRewriteToLogin) {
        // This case is tricky, usually means it's a rewrite to a protected admin page
        // The primary check is in the isAdminPath block below.
        // If someone tries to access /secure-admin-zone directly, it's blocked.
    } else if (!isInternalRewriteToLogin && pathname === '/secure-admin-zone/login') {
        // This is someone trying to access the physical login page directly,
        // which is okay if middleware then rewrites them to the secret login page
        // or they came from the secret login page.
        // But mostly, we want to redirect them to the *secret* login page.
        return NextResponse.redirect(new URL(`/${adminSecretSegment}/login`, origin));
    }
     else if (!isInternalRewriteToLogin && !isInternalRewriteToAdmin) {
        console.log(`Middleware: Denying direct access to physical admin path ${pathname}`);
        return new Response('Not Found', { status: 404 });
    }
  }
  
  // 2. Handle API routes for authentication (allow them through)
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // 3. Handle requests to the secret admin URL segment
  if (isAdminPath) {
    if (isLoginPage) {
      if (session) {
        // If authenticated and trying to access login page, redirect to admin dashboard or callbackUrl
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith(origin)) {
             return NextResponse.redirect(new URL(callbackUrl, origin));
        }
        return NextResponse.redirect(new URL(`/${adminSecretSegment}`, origin));
      }
      // Not authenticated, on login page: rewrite to physical login page component
      // Pass existing query params (like callbackUrl) to the physical login page.
      const newLoginUrl = new URL(`/secure-admin-zone/login${search}`, origin);
      return NextResponse.rewrite(newLoginUrl);
    }

    // Trying to access any other protected admin page
    if (!session) {
      // Not authenticated, redirect to the secret login page
      const loginUrl = new URL(`/${adminSecretSegment}/login`, origin);
      // Preserve returnTo query param if it exists, or set it to the current path
      const redirectTo = `${origin}${pathname}${search}`; // Include existing search params
      loginUrl.searchParams.set('callbackUrl', redirectTo);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated: rewrite to the physical admin path
    // Pass existing query params to the physical admin page.
    const newPath = pathname.replace(`/${adminSecretSegment}`, '/secure-admin-zone');
    return NextResponse.rewrite(new URL(`${newPath}${search}`, origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
