import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Public frontend configuration. Supabase publishable/anon keys are designed
// for browser use; never place a service-role key or database password here.
const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://efdtxbbhggdcohigelmw.supabase.co';
const rawKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  'sb_publishable_FYuv4ejFnjYOOg8i29xD5w_3oKyytaD';

export const isRealSupabase = Boolean(
  rawUrl &&
    rawKey &&
    rawUrl.startsWith('https://') &&
    !rawKey.includes('your-sb_publishable-key') &&
    rawKey.trim().length > 10
);

export const isSupabaseConfigured = isRealSupabase;

// Never emulate authentication or database writes in the browser. If real
// configuration is unavailable, public pages use bundled defaults and Admin
// remains unavailable rather than pretending writes succeeded.
export const supabase: SupabaseClient | null = isRealSupabase
  ? createClient(rawUrl, rawKey, {
      global: {
        // Avoid browser HTTP caching for shared published website content.
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
