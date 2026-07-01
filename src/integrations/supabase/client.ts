import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Trim whitespace/newlines that can sneak in via copy-paste in Vercel dashboard
const SUPABASE_URL             = (import.meta.env.VITE_SUPABASE_URL as string).trim();
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string).trim();

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
  );
}

// Warn loudly if any non-ISO-8859-1 character made it into the key.
// These cause "string contains non ISO-8859-1 code point" on every fetch.
const warnIfDirty = (name: string, value: string) => {
  const bad = [...value].find(c => c.charCodeAt(0) > 255 || /[\r\n]/.test(c));
  if (bad) {
    console.error(
      `[Supabase] ${name} contains an invalid character (code ${bad.charCodeAt(0)}). ` +
      'Delete and recreate this environment variable in Vercel → Settings → Environment Variables.'
    );
  }
};

warnIfDirty('VITE_SUPABASE_URL', SUPABASE_URL);
warnIfDirty('VITE_SUPABASE_PUBLISHABLE_KEY', SUPABASE_PUBLISHABLE_KEY);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage:            localStorage,
    persistSession:     true,
    autoRefreshToken:   true,
    detectSessionInUrl: false,   // manual exchange in AuthCallback — avoids race with subscriber
    flowType:           'pkce',
  },
});
