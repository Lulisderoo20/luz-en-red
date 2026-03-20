import { isSupabaseConfigured } from '@/lib/env';
import { DemoAdapter } from '@/services/backend/adapters/demoAdapter';
import { SupabaseAdapter } from '@/services/backend/adapters/supabaseAdapter';

const backendAdapter = isSupabaseConfigured ? new SupabaseAdapter() : new DemoAdapter();

export function getBackendAdapter() {
  return backendAdapter;
}
