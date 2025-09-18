"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, X } from "lucide-react"

export function AppUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

    // Listen for service worker updates
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        console.log("🔄 App update available:", event.data.version)
        setShowUpdate(true)
      }
    }

    navigator.serviceWorker.addEventListener("message", handleSWMessage)

    // Check for waiting service worker on load
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setShowUpdate(true)
      }

      // Listen for new service worker installing
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setShowUpdate(true)
            }
          })
        }
      })
    })

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSWMessage)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready

        // Clear all caches first
        if ("caches" in window) {
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map((name) => caches.delete(name)))
          console.log("🗑️ All caches cleared")
        }

        // Skip waiting and activate new service worker
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" })
        }

        // Force reload the page
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error("❌ Update failed:", error)
      setIsUpdating(false)
    }
  }

  const handleForceRefresh = () => {
    // Hard refresh with cache bypass
    window.location.reload()
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">App Updated!</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                New features and improvements are available. Refresh to see the latest changes.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpdate(false)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Update Now
                </>
              )}
            </Button>
            <Button onClick={handleForceRefresh} variant="outline" size="sm">
              Force Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
