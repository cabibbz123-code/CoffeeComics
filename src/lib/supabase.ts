import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!client) {
    client = createClient();
  }
  return client;
}

// Check if user is an admin
export async function isAdmin(email: string): Promise<boolean> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, role, is_active')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return true;
}

// Get admin user details
export async function getAdminUser(email: string) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}
