import { createClient } from '@supabase/supabase-js';

// Los valores salen del archivo .env (local) o de las Environment Variables de Vercel.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && key);

export const supabase = supabaseConfigurado ? createClient(url, key) : null;
