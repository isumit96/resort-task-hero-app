
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://btpyziqdiayfezhvcfof.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cHl6aXFkaWF5ZmV6aHZjZm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MTMxMzMsImV4cCI6MjA1ODI4OTEzM30.6VTQ39xzhfAUeTE-lqiUL2_dCcPXlV-tBCX1ekkqKhE";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'auth-storage',
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'pkce',
    sessionExpiryMargin: 60 * 60 * 24 * 180 // 180 days (6 months) in seconds
  }
});
