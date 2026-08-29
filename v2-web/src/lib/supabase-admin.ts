import { createClient } from '@supabase/supabase-js';
import { env } from './env';

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations will fail.');
}

// Client for backend admin operations (bypasses RLS)
// Reserved placeholders keep build and public read-only pages alive when secrets are unavailable.
// Admin operations still fail closed because the placeholder key has no database privileges.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL || 'https://supabase.invalid',
  env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key',
  {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});
