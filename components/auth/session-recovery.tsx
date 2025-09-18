"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SessionRecovery() {
  const [isRecovering, setIsRecovering] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const attemptSessionRecovery = async () => {
      // Don't attempt recovery if we've done it recently (within 2 minutes)
      const now = Date.now()
      if (now - lastRefresh < 2 * 60 * 1000) {
        return
      }

      try {
        setIsRecovering(true)

        // Check if we have a session
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session recovery error:", error.message)
          return
        }

        // If we have a session but it might be stale, refresh it
        if (data?.session) {
          const { error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError) {
            console.error("Session refresh error:", refreshError.message)
          } else {
            console.log("Session successfully refreshed")
            setLastRefresh(now)
            // Force a router refresh to update the UI with the new session
            router.refresh()
          }
        }
      } catch (err) {
        console.error("Session recovery failed:", err)
      } finally {
        setIsRecovering(false)
      }
    }

    // Run recovery on mount
    attemptSessionRecovery()

    // Also set up an interval to periodically refresh the session
    const intervalId = setInterval(attemptSessionRecovery, 10 * 60 * 1000) // Every 10 minutes

    return () => clearInterval(intervalId)
  }, [router, supabase, lastRefresh])

  // Also listen for visibility changes to refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // When tab becomes visible again, try to refresh the session
        const attemptRefresh = async () => {
          try {
            const { error } = await supabase.auth.refreshSession()
            if (!error) {
              router.refresh()
            }
          } catch (err) {
            console.error("Visibility change refresh failed:", err)
          }
        }

        attemptRefresh()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, supabase])

  return null
}
