// WARNING: This file is for backward compatibility only
// It will throw an error if used incorrectly

/**
 * IMPORTANT: This file is for backward compatibility only.
 *
 * - If you're in an App Router component (/app directory), use:
 *   import { createClient } from "@/lib/supabase/server"
 *
 * - If you're in a Pages Router component (/pages directory), use:
 *   import { createClientForPages } from "@/lib/supabase/pages-server"
 */

// This function will throw an error if used
export function createServerComponentClient() {
  throw new Error(
    "ERROR: You're importing createServerComponentClient from a compatibility layer. " +
      "This will cause deployment errors. " +
      "If you're in an App Router component (/app directory), use: " +
      "import { createClient } from '@/lib/supabase/server' " +
      "If you're in a Pages Router component (/pages directory), use: " +
      "import { createClientForPages } from '@/lib/supabase/pages-server'",
  )
}

// This function will throw an error if used
export function createServerSupabaseClient() {
  throw new Error(
    "ERROR: You're importing createServerSupabaseClient from a compatibility layer. " +
      "This will cause deployment errors. " +
      "If you're in an App Router component (/app directory), use: " +
      "import { createClient } from '@/lib/supabase/server' " +
      "If you're in a Pages Router component (/pages directory), use: " +
      "import { createClientForPages } from '@/lib/supabase/pages-server'",
  )
}
