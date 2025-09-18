"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function useSubscriptionPopup() {
  const [showPopup, setShowPopup] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAndShowPopup()
  }, [])

  const checkAndShowPopup = async () => {
    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if user dismissed permanently
      const dismissed = localStorage.getItem("push-notification-dismissed")
      if (dismissed === "true") return

      // Check if user chose remind later and time hasn't passed
      const remindTime = localStorage.getItem("push-notification-remind")
      if (remindTime && Date.now() < Number.parseInt(remindTime)) return

      // Check if push notifications are supported
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        return
      }

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (subscription) {
          setIsSubscribed(true)
          return
        }
      } catch (err) {
        console.error("Error checking subscription:", err)
      }

      // Show popup after a short delay
      setTimeout(() => {
        setShowPopup(true)
      }, 3000) // 3 seconds after login
    } catch (error) {
      console.error("Error in checkAndShowPopup:", error)
    }
  }

  const handleSubscribe = async () => {
    try {
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        throw new Error("Permission denied")
      }

      const swRegistration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error("VAPID key not configured")
      }

      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      })

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

      setIsSubscribed(true)

      // Send welcome notification
      setTimeout(() => {
        fetch("/api/notifications/test-personal", { method: "POST" }).catch(console.error)
      }, 2000)
    } catch (error) {
      console.error("Subscription failed:", error)
      throw error
    }
  }

  return {
    showPopup,
    setShowPopup,
    isSubscribed,
    handleSubscribe,
  }
}
