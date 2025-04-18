
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://btpyziqdiayfezhvcfof.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cHl6aXFkaWF5ZmV6aHZjZm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MTMxMzMsImV4cCI6MjA1ODI4OTEzM30.6VTQ39xzhfAUeTE-lqiUL2_dCcPXlV-tBCX1ekkqKhE";

// The session expiry is controlled by the server, but we can configure
// how the client handles session persistence and refresh
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true, // Keep the session in storage
    autoRefreshToken: true, // Automatically refresh the token when it's about to expire
    storageKey: 'auth-storage',
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce' // Uses PKCE flow for more secure authentication
  }
});
