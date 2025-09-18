"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function usePresence(userId: string | null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Update presence immediately
    const updatePresence = async () => {
      try {
        await fetch("/api/presence/update", {
          method: "POST",
        })
      } catch (error) {
        console.error("Failed to update presence:", error)
      }
    }

    // Update presence on mount
    updatePresence()

    // Set up interval to update presence every 2 minutes
    intervalRef.current = setInterval(updatePresence, 2 * 60 * 1000)

    // Update presence on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updatePresence()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Update presence on user activity
    const handleActivity = () => {
      updatePresence()
    }

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    let activityTimeout: NodeJS.Timeout | null = null

    const throttledActivity = () => {
      if (activityTimeout) return
      activityTimeout = setTimeout(() => {
        handleActivity()
        activityTimeout = null
      }, 30000) // Throttle to once every 30 seconds
    }

    events.forEach((event) => {
      document.addEventListener(event, throttledActivity, true)
    })

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      events.forEach((event) => {
        document.removeEventListener(event, throttledActivity, true)
      })
    }
  }, [userId, supabase])
}
