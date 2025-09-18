"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function CookieCleaner() {
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Only show in development or if there's an error in the URL
    const isDevEnvironment = process.env.NODE_ENV === "development"
    const hasErrorParam = window.location.search.includes("error=")

    setShowButton(isDevEnvironment || hasErrorParam)
  }, [])

  const clearAllCookies = () => {
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      toast({
        title: "Cookies cleared",
        description: "All cookies have been cleared. Refreshing page...",
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    } catch (error) {
      console.error("Error clearing cookies:", error)
      toast({
        title: "Error",
        description: "Failed to clear cookies. Try again or clear them manually.",
        variant: "destructive",
      })
    }
  }

  if (!showButton) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button variant="destructive" size="sm" onClick={clearAllCookies} className="flex items-center gap-2">
        <Trash2 className="h-4 w-4" />
        Clear Cookies
      </Button>
    </div>
  )
}
