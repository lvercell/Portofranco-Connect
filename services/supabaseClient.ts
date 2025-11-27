
import { createClient } from '@supabase/supabase-js';

// These variables must be set in Vercel Project Settings > Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase Environment Variables. The app will fallback to local storage mode if not configured.');
}

// Create a single supabase client for interacting with your database
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
