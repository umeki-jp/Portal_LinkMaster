// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const configErrors = [];

if (!supabaseUrl) {
  configErrors.push('VITE_SUPABASE_URL is missing.');
} else {
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      configErrors.push('VITE_SUPABASE_URL must start with http:// or https://');
    }
  } catch {
    configErrors.push('VITE_SUPABASE_URL must be a valid URL.');
  }
}

if (!supabaseAnonKey) {
  configErrors.push('VITE_SUPABASE_ANON_KEY is missing.');
}

if (configErrors.length > 0) {
  throw new Error(
    `Supabase environment variables are not configured correctly.\n${configErrors.join('\n')}`
  );
}

// Supabaseと通信するための窓口を作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
