import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * SERVER-ONLY admin client using the service_role key.
 * BYPASSES Row Level Security — use sparingly and only in trusted code:
 *   - Stripe webhooks (no user session available)
 *   - the seed script
 *
 * Never import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    clientEnv.supabaseUrl,
    serverEnv.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
