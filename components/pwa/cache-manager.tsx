"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, RefreshCw, Database } from "lucide-react"

export function CacheManager() {
  const [cacheSize, setCacheSize] = useState<string>("Calculating...")
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    calculateCacheSize()
  }, [])

  const calculateCacheSize = async () => {
    if (!("caches" in window)) {
      setCacheSize("Not supported")
      return
    }

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const requests = await cache.keys()

        for (const request of requests) {
          const response = await cache.match(request)
          if (response) {
            const blob = await response.blob()
            totalSize += blob.size
          }
        }
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2)
      setCacheSize(`${sizeInMB} MB`)
    } catch (error) {
      console.error("Error calculating cache size:", error)
      setCacheSize("Error calculating")
    }
  }

  const clearAllCaches = async () => {
    setIsClearing(true)

    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
        console.log("🗑️ All caches cleared manually")

        // Update service worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" })
          }
        }

        setCacheSize("0 MB")

        // Force reload after clearing
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error("❌ Failed to clear caches:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const forceUpdate = async () => {
    try {
      // Clear caches
      await clearAllCaches()

      // Hard reload
      window.location.reload()
    } catch (error) {
      console.error("❌ Force update failed:", error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Cache Size:</span>
          <span className="font-mono text-sm">{cacheSize}</span>
        </div>

        <div className="flex gap-2">
          <Button onClick={clearAllCaches} disabled={isClearing} variant="destructive" size="sm" className="flex-1">
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </>
            )}
          </Button>

          <Button onClick={forceUpdate} variant="outline" size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Update
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Clear cache if you're not seeing the latest changes after deployment.
        </p>
      </CardContent>
    </Card>
  )
}
