
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;

  const adminSecretSegmentFromEnv = process.env.ADMIN_SECRET_URL_SEGMENT;
  console.log(`[Middleware] START Request to: ${pathname}`);
  console.log(`[Middleware] Read ADMIN_SECRET_URL_SEGMENT from env: "${adminSecretSegmentFromEnv}"`);

  const adminSecretSegment = adminSecretSegmentFromEnv; // Use the value directly
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;

  if (!adminSecretSegment || !nextAuthSecret) {
    console.error('[Middleware] CRITICAL FAILURE: ADMIN_SECRET_URL_SEGMENT or NEXTAUTH_SECRET environment variables are not set!');
    if (pathname.startsWith(`/${adminSecretSegment || 'secure-admin-zone'}`)) { // Check against potential admin paths
        return new Response('Server configuration error: Admin area cannot be accessed due to missing critical environment variables.', { status: 500 });
    }
    return NextResponse.next(); // Allow non-admin paths if env vars for admin are missing
  }

  const session = await getToken({ req: request, secret: nextAuthSecret });
  console.log(`[Middleware] Session object retrieved:`, session ? JSON.stringify(session, null, 2) : 'null');
  if (session) {
    console.log(`[Middleware] Session role: ${(session as any).role}`);
  }

  const isRequestingSecretAdminPath = pathname.startsWith(`/${adminSecretSegment}`);
  const isRequestingPhysicalAdminPath = pathname.startsWith('/secure-admin-zone');
  const isAuthApiRoute = pathname.startsWith('/api/auth');

  // 1. Allow NextAuth API calls to pass through
  if (isAuthApiRoute) {
    console.log(`[Middleware] Allowing NextAuth API route: ${pathname}`);
    return NextResponse.next();
  }

  // 2. Block direct access to physical admin paths.
  if (isRequestingPhysicalAdminPath) {
    console.warn(`[Middleware] Denied direct access attempt to physical admin path: ${pathname}. Responding with 404.`);
    return new Response('Not Found - Direct access to this path is not allowed.', { status: 404 });
  }

  // 3. Handle requests to the secret admin path segment
  if (isRequestingSecretAdminPath) {
    const isSecretLoginPage = pathname === `/${adminSecretSegment}/login`;
    console.log(`[Middleware] Secret admin path requested: ${pathname}. Is login page: ${isSecretLoginPage}`);

    if (isSecretLoginPage) {
      if (session && (session as any).role === 'admin') {
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
        const redirectTarget = callbackUrl && callbackUrl.startsWith(origin) && !callbackUrl.includes(`/${adminSecretSegment}/login`)
          ? callbackUrl
          : `/${adminSecretSegment}`;
        console.log(`[Middleware] Authenticated admin on login page, redirecting to: ${redirectTarget}`);
        return NextResponse.redirect(new URL(redirectTarget, origin));
      }
      console.log(`[Middleware] Unauthenticated/non-admin access to secret login page, rewriting to /secure-admin-zone/login${search}`);
      return NextResponse.rewrite(new URL(`/secure-admin-zone/login${search}`, origin));
    } else {
      // This is for any OTHER page under the secret admin segment (e.g., dashboard, create, edit)
      console.log(`[Middleware] Checking auth for non-login secret admin path: ${pathname}`);
      if (!session || (session as any).role !== 'admin') {
        const loginUrl = new URL(`/${adminSecretSegment}/login`, origin);
        const redirectTo = `${origin}${pathname}${search}`;
        loginUrl.searchParams.set('callbackUrl', redirectTo);
        console.log(`[Middleware] Unauthenticated/non-admin access to "${pathname}", redirecting to login: ${loginUrl.toString()}`);
        return NextResponse.redirect(loginUrl);
      }

      // User IS authenticated as admin, rewrite to the corresponding physical path.
      const newPhysicalPath = pathname.replace(`/${adminSecretSegment}`, '/secure-admin-zone');
      console.log(`[Middleware] Authenticated admin access to "${pathname}", rewriting to "${newPhysicalPath}${search}"`);
      return NextResponse.rewrite(new URL(`${newPhysicalPath}${search}`, origin));
    }
  }

  // 4. For any other path not handled above, let the request proceed.
  console.log(`[Middleware] Allowing non-admin path: ${pathname}`);
  return NextResponse.next();
}

// Apply middleware to relevant paths.
export const config = {
  matcher: [
    // Matches all paths except for Next.js internal paths and static assets.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
