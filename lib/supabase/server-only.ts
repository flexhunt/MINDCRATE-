import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"
import type { GetServerSidePropsContext } from "next"
import type { Database } from "@/types/supabase"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// For Pages Router - this is a wrapper to get session in a consistent way
export async function getServerSession(context?: GetServerSidePropsContext) {
  if (!context) {
    console.error("getServerSession called without context in Pages Router")
    // Return empty session data to prevent further errors
    return { data: { session: null } }
  }

  const supabase = createServerSupabaseClient<Database>(context)
  return supabase.auth.getSession()
}

export async function getServerUser(context?: GetServerSidePropsContext) {
  const { data } = await getServerSession(context)
  return data.session?.user || null
}

// Helper for components that need to check auth status
export function createSessionHelper(context: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient<Database>(context)

  return {
    getSession: async () => supabase.auth.getSession(),
    getUser: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session?.user || null
    },
  }
}

// Export the createClient function for server-side usage
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

// Also export as named export for compatibility
