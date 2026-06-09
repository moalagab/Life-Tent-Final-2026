import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://oocddixbjiynladnvdfx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vY2RkaXhiaml5bmxhZG52ZGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzIzMjgsImV4cCI6MjA5NjUwODMyOH0.WpMCP0TBvcyWP7ik_t8QgCeOOVFhaS6aVNNIUl0wtrI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
  }
});