
import {NextResponse, type NextRequest} from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const adminSecretSegment = process.env.ADMIN_SECRET_URL_SEGMENT;
  const adminLoginToken = process.env.ADMIN_LOGIN_TOKEN;
  const adminAuthCookieName = process.env.ADMIN_AUTH_COOKIE_NAME;

  if (!adminSecretSegment || !adminLoginToken || !adminAuthCookieName) {
    console.error('Admin security environment variables are not set!');
    // In a real scenario, you might want to return a generic error or allow non-admin access
    // For now, if not configured, we'll just let requests pass through (less secure for admin)
    // or block all admin access if you prefer. For this setup, let's assume they are set.
    // If critical, return new Response('Configuration error', { status: 500 });
    return NextResponse.next();
  }

  const adminPattern = new RegExp(`^/${adminSecretSegment}(/.*)?$`);
  const isAdminPath = adminPattern.test(pathname);
  const physicalAdminPathPattern = /^\/secure-admin-zone(\/.*)?$/;

  // Block direct access to the physical admin path
  if (physicalAdminPathPattern.test(pathname)) {
    return new Response('Not Found', {status: 404});
  }

  if (isAdminPath) {
    const cookie = request.cookies.get(adminAuthCookieName);
    const isAuthenticated = cookie?.value === adminLoginToken; // Simple check for this example

    const isLoginPage = pathname === `/${adminSecretSegment}/login`;

    if (isLoginPage) {
      const tokenFromQuery = request.nextUrl.searchParams.get('token');
      if (tokenFromQuery === adminLoginToken) {
        // Allow access to login page if token is correct, it will set the cookie
        return NextResponse.next();
      }
      if (isAuthenticated) {
        // Already authenticated and trying to access login, redirect to admin home
        return NextResponse.redirect(new URL(`/${adminSecretSegment}`, request.url));
      }
      // Invalid or no token for login page, and not authenticated
      return new Response('Not Found', {status: 404});
    }

    if (!isAuthenticated) {
      // Not authenticated and trying to access a protected admin page
      return new Response('Not Found', {status: 404});
    }

    // If authenticated, rewrite the URL to the physical path
    const newPath = pathname.replace(`/${adminSecretSegment}`, '/secure-admin-zone');
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
