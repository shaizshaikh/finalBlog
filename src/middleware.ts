
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;

  // Ensure ADMIN_SECRET_URL_SEGMENT is read from the environment.
  // NEXT_PUBLIC_ prefix is not needed for server-side middleware access.
  const adminSecretSegment = process.env.ADMIN_SECRET_URL_SEGMENT;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!adminSecretSegment || !nextAuthSecret) {
    console.error('Middleware Critical Failure: ADMIN_SECRET_URL_SEGMENT or NEXTAUTH_SECRET environment variables are not set!');
    // For paths that would have been admin paths, return a server error. Otherwise, let non-admin paths through.
    if (pathname.startsWith(`/${adminSecretSegment || 'default-admin-placeholder'}`) || pathname.startsWith('/secure-admin-zone')) {
         return new Response('Server configuration error: Admin area cannot be accessed.', { status: 500 });
    }
    return NextResponse.next();
  }

  const session = await getToken({ req: request, secret: nextAuthSecret });

  const isRequestingSecretAdminPath = pathname.startsWith(`/${adminSecretSegment}`);
  const isRequestingPhysicalAdminPath = pathname.startsWith('/secure-admin-zone');
  const isAuthApiRoute = pathname.startsWith('/api/auth');

  // 1. Allow NextAuth API calls to pass through
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // 2. Block direct access to physical admin paths.
  // Only rewrites from the secret path should reach these.
  if (isRequestingPhysicalAdminPath) {
    console.warn(`Middleware: Denied direct access attempt to physical admin path: ${pathname}`);
    // Respond with 404 by rewriting to a known not-found page or a generic 404 response.
    // Using a rewrite to a custom _not-found is cleaner if you have one.
    // For now, a simple 404 response.
    return new Response('Not Found', { status: 404 });
  }

  // 3. Handle requests to the secret admin path segment
  if (isRequestingSecretAdminPath) {
    const isSecretLoginPage = pathname === `/${adminSecretSegment}/login`;

    if (isSecretLoginPage) {
      if (session && (session as any).role === 'admin') {
        // User is authenticated and trying to access the login page, redirect them.
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
        if (callbackUrl && callbackUrl.startsWith(origin) && !callbackUrl.includes(`/${adminSecretSegment}/login`)) {
            console.log(`Middleware: Authenticated user on login, redirecting to callbackUrl: ${callbackUrl}`);
            return NextResponse.redirect(new URL(callbackUrl, origin));
        }
        console.log(`Middleware: Authenticated user on login, redirecting to admin dashboard: /${adminSecretSegment}`);
        return NextResponse.redirect(new URL(`/${adminSecretSegment}`, origin));
      }
      // User is not authenticated or not an admin, show the login page.
      // Rewrite to the physical login page component.
      console.log(`Middleware: Unauthenticated user accessing secret login page, rewriting to /secure-admin-zone/login${search}`);
      return NextResponse.rewrite(new URL(`/secure-admin-zone/login${search}`, origin));
    }

    // For any other page under the secret admin segment
    if (!session || (session as any).role !== 'admin') {
      // User is not authenticated as admin, redirect to the secret login page.
      // Preserve the intended destination as callbackUrl.
      const loginUrl = new URL(`/${adminSecretSegment}/login`, origin);
      const redirectTo = `${origin}${pathname}${search}`; // Include current query params
      loginUrl.searchParams.set('callbackUrl', redirectTo);
      console.log(`Middleware: Unauthenticated access to ${pathname}, redirecting to login: ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated as admin, rewrite to the corresponding physical path.
    const newPhysicalPath = pathname.replace(`/${adminSecretSegment}`, '/secure-admin-zone');
    console.log(`Middleware: Authenticated admin access to ${pathname}, rewriting to ${newPhysicalPath}${search}`);
    return NextResponse.rewrite(new URL(`${newPhysicalPath}${search}`, origin));
  }

  // 4. For any other path not handled above, let the request proceed.
  return NextResponse.next();
}

// Apply middleware to relevant paths.
export const config = {
  matcher: [
    // Matches all paths except for Next.js internal paths and static assets.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
