import { auth } from '@/auth';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
  const isPublicApi = nextUrl.pathname.startsWith('/api/auth');

  if (isPublicApi) return;

  if (!isLoggedIn && !isAuthPage) {
    const url = new URL('/login', nextUrl.origin);
    url.searchParams.set('callbackUrl', nextUrl.pathname);
    return Response.redirect(url);
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/Dashboard', nextUrl.origin));
  }
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
