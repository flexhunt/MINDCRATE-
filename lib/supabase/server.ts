import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

// This is a conditional import to avoid the "next/headers" error in Pages Router
let cookiesModule: any
try {
  // This will only execute in App Router
  cookiesModule = require("next/headers")
} catch (e) {
  // Fallback for Pages Router
  cookiesModule = {
    cookies: () => ({
      get: (name: string) => ({ value: document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop() || "" }),
      set: (opts: any) => {
        document.cookie = `${opts.name}=${opts.value}${opts.options?.path ? `;path=${opts.options.path}` : ""}${opts.options?.maxAge ? `;max-age=${opts.options.maxAge}` : ""}${opts.options?.domain ? `;domain=${opts.options.domain}` : ""}${opts.options?.secure ? ";secure" : ""}${opts.options?.httpOnly ? ";httpOnly" : ""}`
      },
    }),
  }
}

// For App Router (Server Components) ONLY
export function createClient() {
  const cookieStore =
    typeof window === "undefined"
      ? cookiesModule.cookies()
      : {
          get: (name: string) => ({ value: document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop() || "" }),
          set: (opts: any) => {
            document.cookie = `${opts.name}=${opts.value}${opts.options?.path ? `;path=${opts.options.path}` : ""}${opts.options?.maxAge ? `;max-age=${opts.options.maxAge}` : ""}${opts.options?.domain ? `;domain=${opts.options.domain}` : ""}${opts.options?.secure ? ";secure" : ""}${opts.options?.httpOnly ? ";httpOnly" : ""}`
          },
        }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}

// Aliases for App Router only
export const createServerComponentClient = createClient
export const createServerSupabaseClient = createClient
