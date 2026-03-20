const routerMode = import.meta.env.VITE_ROUTER_MODE === 'browser' ? 'browser' : 'hash';

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '',
  supabaseRedirectUrl: import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim() || '',
  routerMode,
  basePath: import.meta.env.VITE_BASE_PATH?.trim() || '/',
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
