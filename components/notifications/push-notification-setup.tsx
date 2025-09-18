"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Bell, BellOff, Loader2, CheckCircle, Zap } from "lucide-react"

export function PushNotificationSetup() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkPushStatus()
  }, [])

  const checkPushStatus = async () => {
    try {
      console.log("🔍 Checking notification status...")

      // Quick support check
      const supported =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window

      console.log("📱 Browser support:", supported)
      setIsSupported(supported)

      if (!supported) {
        setIsChecking(false)
        return
      }

      // Force service worker registration immediately
      try {
        console.log("⚙️ Ensuring service worker is ready...")
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always check for updates
        })

        // Force update check
        await registration.update()
        await navigator.serviceWorker.ready

        console.log("✅ Service worker ready")

        // Check subscription
        const subscription = await registration.pushManager.getSubscription()
        console.log("🔔 Browser subscription:", !!subscription)

        if (subscription) {
          // Also check database
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data } = await supabase.from("push_subscriptions").select("id").eq("user_id", user.id).single()
            const dbSubscribed = !!data
            console.log("💾 Database subscription:", dbSubscribed)
            setIsSubscribed(!!subscription && dbSubscribed)
          }
        }
      } catch (error) {
        console.log("⚠️ Service worker check failed:", error)
      }
    } catch (error) {
      console.error("❌ Check status error:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    console.log("🚀 Starting REAL-TIME subscription process...")

    try {
      // Step 1: Request permission with user gesture
      console.log("🔐 Requesting permission...")
      const permission = await Notification.requestPermission()
      console.log("🔐 Permission result:", permission)

      if (permission !== "granted") {
        toast({
          title: "Permission Required",
          description: "Please allow notifications for real-time updates!",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Step 2: Force register service worker
      console.log("⚙️ Registering service worker for real-time notifications...")
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })

      // Force immediate activation
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      }

      await navigator.serviceWorker.ready
      console.log("✅ Service worker ready for real-time notifications")

      // Step 3: Get VAPID key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID key not configured")
      }

      // Step 4: Create push subscription with HIGH PRIORITY
      console.log("📡 Creating HIGH PRIORITY push subscription...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })
      console.log("📡 Real-time push subscription created")

      // Step 5: Save to database
      console.log("💾 Saving subscription for real-time delivery...")
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      console.log("✅ Real-time notifications enabled!")
      setIsSubscribed(true)
      toast({
        title: "🔥 Real-Time Notifications Enabled!",
        description: "You'll get instant updates even when app is closed!",
      })

      // Send immediate test notification
      setTimeout(() => {
        fetch("/api/notifications/test-personal", { method: "POST" }).catch(console.error)
      }, 500)
    } catch (error: any) {
      console.error("❌ Real-time subscription error:", error)
      toast({
        title: "Setup Failed",
        description: "Could not enable real-time notifications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
      toast({
        title: "Notifications Disabled",
        description: "You can turn them back on anytime.",
      })
    } catch (error) {
      console.error("Unsubscribe error:", error)
      toast({
        title: "Error",
        description: "Could not disable notifications.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state briefly
  if (isChecking) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Setting up real-time notifications...</span>
        </div>
      </div>
    )
  }

  // Don't show anything if not supported
  if (!isSupported) {
    return null
  }

  // Show enabled state (small and clean)
  if (isSubscribed) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Real-Time Notifications ON</span>
            <Zap className="h-3 w-3 text-yellow-500" />
          </div>
          <Button
            onClick={handleUnsubscribe}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-7 px-2 text-xs text-green-700 hover:text-red-600"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BellOff className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    )
  }

  // Show turn on state (small and clean)
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Enable Real-Time Notifications</span>
          <Zap className="h-3 w-3 text-yellow-500" />
        </div>
        <Button
          onClick={handleSubscribe}
          disabled={isLoading}
          size="sm"
          className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Turn On"}
        </Button>
      </div>
    </div>
  )
}
