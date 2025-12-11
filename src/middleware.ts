import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow access to login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Create response to potentially modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Check for valid session
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    // No valid session - redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists - verify user is in admin_users table
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('id, is_active')
    .eq('email', session.user.email?.toLowerCase())
    .eq('is_active', true)
    .single();

  if (adminError || !adminUser) {
    // User is authenticated but not an admin - redirect to login with error
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('error', 'not_authorized');
    
    // Sign them out since they're not authorized
    await supabase.auth.signOut();
    
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated and is an admin - allow access
  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all admin routes
    '/admin/:path*',
  ],
};
