"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window
      setIsSupported(supported)

      if (supported) {
        checkExistingSubscription()
      }
    }

    const checkExistingSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready
        const existingSubscription = await registration.pushManager.getSubscription()

        if (existingSubscription) {
          setSubscription(existingSubscription)
          setIsSubscribed(true)
        }
      } catch (error) {
        console.error("Error checking subscription:", error)
      }
    }

    checkSupport()
  }, [])

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      console.error("Push notifications not supported")
      return false
    }

    setIsLoading(true)

    try {
      // Request notification permission
      const permission = await Notification.requestPermission()

      if (permission !== "granted") {
        console.error("Notification permission denied")
        setIsLoading(false)
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Save subscription to database
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("User not authenticated")
        setIsLoading(false)
        return false
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: pushSubscription.endpoint,
        p256dh: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey("p256dh")!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(pushSubscription.getKey("auth")!))),
        user_agent: navigator.userAgent,
      }

      const { error } = await supabase.from("push_subscriptions").upsert(subscriptionData, {
        onConflict: "user_id,endpoint",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error("Error saving subscription:", error)
        setIsLoading(false)
        return false
      }

      setSubscription(pushSubscription)
      setIsSubscribed(true)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      setIsLoading(false)
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false

    setIsLoading(true)

    try {
      // Unsubscribe from push notifications
      await subscription.unsubscribe()

      // Remove from database
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", subscription.endpoint)
      }

      setSubscription(null)
      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Error unsubscribing:", error)
      setIsLoading(false)
      return false
    }
  }

  const testNotification = async () => {
    if (!isSubscribed) return

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to send test notification")
      }

      console.log("Test notification sent!")
    } catch (error) {
      console.error("Error sending test notification:", error)
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    testNotification,
  }
}
