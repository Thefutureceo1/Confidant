import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db } from './storage';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = db.getSupabaseConfig();
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const url = config?.url || envUrl;
  const anonKey = config?.anonKey || envAnonKey;

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export function resetSupabaseClient(): void {
  supabaseInstance = null;
}
