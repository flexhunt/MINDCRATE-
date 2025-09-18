import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Add CORS headers for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next()

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return response
  }

  // Handle sitemap.xml request
  if (pathname === "/sitemap.xml") {
    return NextResponse.rewrite(new URL("/api/sitemap", req.url))
  }

  // Handle Google verification file
  if (pathname === "/googleb28db6267a2bea1a.html") {
    return NextResponse.next()
  }

  const res = NextResponse.next()

  try {
    // Create the Supabase middleware client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            res.cookies.set({
              name,
              value: "",
              ...options,
            })
          },
        },
      },
    )

    // Get the session and log the result
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // For protected routes, don't redirect immediately if no session
    // This allows the client-side auth recovery to work
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/profile") || pathname.startsWith("/admin")) {
      // If no session, we'll still let the request through
      // The client-side ProtectedRoute component will handle redirection if needed
      console.log(`Protected route ${pathname}, Session exists: ${!!session}`)

      // Attempt to refresh the session
      if (session) {
        await supabase.auth.refreshSession()
      }
    }

    return res
  } catch (err) {
    console.error("Middleware exception:", err)
    return res
  }
}

// Update the matcher to include admin routes and Google verification
export const config = {
  matcher: [
    "/sitemap.xml",
    "/googleb28db6267a2bea1a.html",
    "/dashboard/:path*",
    "/profile/:path*",
    "/u/:path*",
    "/admin/:path*",
    "/mental-ascension/admin/:path*",
  ],
}
