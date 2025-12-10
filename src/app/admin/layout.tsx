'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabase, isAdmin } from '@/lib/supabase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setLoading(false);
      setAuthorized(true);
      return;
    }

    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in - redirect to login
        router.push('/admin/login');
        return;
      }

      // Check if user is admin
      const adminCheck = await isAdmin(session.user.email!);
      
      if (!adminCheck) {
        // Logged in but not an admin - sign out and redirect
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      // User is authenticated and authorized
      setAuthorized(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children only if authorized
  if (!authorized && pathname !== '/admin/login') {
    return null;
  }

  return <>{children}</>;
}
