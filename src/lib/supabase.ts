import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ygymcnnlkmocskujhptf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlneW1jbm5sa21vY3NrdWpocHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MjE5NDcsImV4cCI6MjA4ODI5Nzk0N30.FiO49IOBEC9qENLiMYCmgeLabLDtDW5iyFZuLy9pmvc';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Using hardcoded Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
