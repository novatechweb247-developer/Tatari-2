import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const isRealSupabase = Boolean(
  rawUrl &&
    rawKey &&
    rawUrl.startsWith('https://') &&
    !rawKey.includes('your-sb_publishable-key') &&
    rawKey.trim().length > 10
);

export const isSupabaseConfigured = isRealSupabase;

// Never emulate authentication or database writes in the browser. If the shared
// Supabase configuration is missing, public pages use their bundled defaults
// and the Admin Center remains unavailable until real configuration is supplied.
export const supabase: SupabaseClient | null = isRealSupabase
  ? createClient(rawUrl!, rawKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
