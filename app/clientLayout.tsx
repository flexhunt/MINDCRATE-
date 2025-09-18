"use client"

import type React from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toast"
import { ThemeProvider } from "@/components/theme-provider"
import BroadcastProvider from "@/components/broadcast/broadcast-provider"
import { NavigationProgress } from "@/components/ui/nprogress"
import BroadcastBanner from "@/components/broadcast/broadcast-banner"
import { NavigationProvider } from "@/components/providers/navigation-provider"
import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)

  // Get session on client side with improved persistence
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    // Initial session check
    const fetchSession = async () => {
      try {
        // First try to get the session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session fetch error:", error.message)
          return
        }

        // If we have a session, try to refresh it
        if (data.session) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.error("Session refresh error:", refreshError.message)
          } else if (refreshData.session) {
            setUserId(refreshData.session.user.id)
            return
          }
        }

        // If we get here, either we had no session or refresh failed
        setUserId(data.session?.user?.id || null)
      } catch (err) {
        console.error("Session fetch failed:", err)
      }
    }

    fetchSession()

    // Set up auth state listener with reduced logging
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only log significant auth events, not every state change
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        console.log("Auth state changed:", event)
      }
      setUserId(session?.user?.id || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NavigationProvider>
            <NavigationProgress />
            <BroadcastProvider>
              {userId && <BroadcastBanner userId={userId} />}
              {children}
            </BroadcastProvider>
          </NavigationProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
