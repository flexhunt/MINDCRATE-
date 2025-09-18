"use client"

import { useEffect, useState } from "react"
import { useUser } from "@supabase/auth-helpers-react"

export function useLocationDetection() {
  const [isDetecting, setIsDetecting] = useState(false)
  const [country, setCountry] = useState<string | null>(null)
  const user = useUser()

  useEffect(() => {
    if (!user) return

    const detectLocation = async () => {
      try {
        setIsDetecting(true)

        const response = await fetch("/api/detect-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const data = await response.json()

        if (data.success && data.country) {
          setCountry(data.country)
        }
      } catch (error) {
        console.error("Location detection failed:", error)
      } finally {
        setIsDetecting(false)
      }
    }

    // Detect location after a short delay to not block initial render
    const timer = setTimeout(detectLocation, 2000)

    return () => clearTimeout(timer)
  }, [user])

  return { isDetecting, country }
}
