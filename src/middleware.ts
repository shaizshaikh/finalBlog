
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  const adminSecretSegment = process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!adminSecretSegment || !nextAuthSecret) {
    console.error('Middleware: Security environment variables (ADMIN_SECRET_URL_SEGMENT or NEXTAUTH_SECRET) are not set!');
    // Return 500 or allow non-admin access if this happens in prod.
    // For now, we will just show a generic error to avoid breaking non-admin parts of the site.
    if (pathname.startsWith(`/${adminSecretSegment}`)) {
         return new Response('Server configuration error.', { status: 500 });
    }
    return NextResponse.next();
  }

  const session = await getToken({ req: request, secret: nextAuthSecret });

  const isAdminPath = pathname.startsWith(`/${adminSecretSegment}`);
  const isLoginPage = pathname === `/${adminSecretSegment}/login`;
  const isAuthApiRoute = pathname.startsWith('/api/auth');

  const physicalAdminPathPattern = /^\/secure-admin-zone(\/.*)?$/;

  // 1. Block direct access to the physical admin directory
  if (physicalAdminPathPattern.test(pathname) && pathname !== '/secure-admin-zone/login') {
    // Allow access to physical login page only if rewritten by middleware
    const isInternalRewrite = request.headers.get('x-middleware-rewrite');
    if (!isInternalRewrite || !isInternalRewrite.includes('/secure-admin-zone/login')) {
         console.log(`Middleware: Denying direct access to ${pathname}`);
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
        // If authenticated and trying to access login page, redirect to admin dashboard
        return NextResponse.redirect(new URL(`/${adminSecretSegment}`, origin));
      }
      // Not authenticated, on login page: rewrite to physical login page component
      const newLoginUrl = new URL(`/secure-admin-zone/login${request.nextUrl.search}`, origin);
      return NextResponse.rewrite(newLoginUrl);
    }

    // Trying to access any other protected admin page
    if (!session) {
      // Not authenticated, redirect to the secret login page
      const loginUrl = new URL(`/${adminSecretSegment}/login`, origin);
      // Preserve returnTo query param if it exists, or set it to the current path
      const redirectTo = pathname.startsWith(`/${adminSecretSegment}`) ? pathname : `/${adminSecretSegment}`;
      loginUrl.searchParams.set('callbackUrl', `${origin}${redirectTo}`);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated: rewrite to the physical admin path
    const newPath = pathname.replace(`/${adminSecretSegment}`, '/secure-admin-zone');
    return NextResponse.rewrite(new URL(newPath, origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Specific API routes if not handled by the general /api/auth rule.
     *
     * The /api/auth routes are handled by the middleware check above.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
