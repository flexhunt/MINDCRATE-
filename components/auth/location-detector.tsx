"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function LocationDetector() {
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const supabase = createClient()

        // Check if user is logged in
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Check if country already detected recently
        const { data: profile } = await supabase
          .from("profiles")
          .select("country, country_detected_at")
          .eq("id", user.id)
          .single()

        if (profile?.country && profile?.country_detected_at) {
          const detectedAt = new Date(profile.country_detected_at)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

          if (detectedAt > thirtyDaysAgo) {
            return // Already detected recently
          }
        }

        // Detect location silently
        await fetch("/api/detect-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (error) {
        // Silently fail - don't break the app
        console.debug("Location detection failed:", error)
      }
    }

    // Run detection after a delay to not block initial page load
    const timer = setTimeout(detectUserLocation, 3000)

    return () => clearTimeout(timer)
  }, [])

  // This component renders nothing - it's just for side effects
  return null
}
