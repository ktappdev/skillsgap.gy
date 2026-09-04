import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabasePublishableKey);
}
