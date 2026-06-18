"use client";

import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Client Components / browser.
 * Uses the public anon key — RLS protects the data.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.supabaseUrl,
    clientEnv.supabaseAnonKey,
  );
}
