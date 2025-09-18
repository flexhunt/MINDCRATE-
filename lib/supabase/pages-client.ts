import { createServerClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next"

// For Pages Router (getServerSideProps, API Routes)
export function createClientForPages(
  context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse },
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          context.res.setHeader(
            "Set-Cookie",
            `${name}=${value}; Path=/; ${options.path ? `Path=${options.path}; ` : ""}${
              options.maxAge ? `Max-Age=${options.maxAge}; ` : ""
            }${options.domain ? `Domain=${options.domain}; ` : ""}${options.secure ? "Secure; " : ""}${
              options.httpOnly ? "HttpOnly; " : ""
            }${options.sameSite ? `SameSite=${options.sameSite}; ` : ""}`,
          )
        },
        remove(name: string, options: any) {
          context.res.setHeader(
            "Set-Cookie",
            `${name}=; Path=/; ${options.path ? `Path=${options.path}; ` : ""}Max-Age=0; ${
              options.domain ? `Domain=${options.domain}; ` : ""
            }${options.secure ? "Secure; " : ""}${options.httpOnly ? "HttpOnly; " : ""}${
              options.sameSite ? `SameSite=${options.sameSite}; ` : ""
            }`,
          )
        },
      },
    },
  )
}

// Aliases for backward compatibility
export const createServerSupabaseClient = createClientForPages
