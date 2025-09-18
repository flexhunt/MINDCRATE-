"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, BellOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SubscriptionManager() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [subscriptionData, setSubscriptionData] = useState<any>(null)
  const { toast } = useToast()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }

  useEffect(() => {
    checkSubscriptionStatus()
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      addLog("🔍 Checking subscription status...")

      if (!("serviceWorker" in navigator)) {
        addLog("❌ Service Worker not supported")
        return
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        addLog("✅ Found existing subscription")
        setIsSubscribed(true)
        setSubscriptionData(subscription)

        // Check if it's saved in database
        await checkDatabaseSubscription(subscription)
      } else {
        addLog("⚠️ No subscription found")
        setIsSubscribed(false)
      }
    } catch (error) {
      addLog(`❌ Error checking subscription: ${error}`)
    }
  }

  const checkDatabaseSubscription = async (subscription: PushSubscription) => {
    try {
      const response = await fetch("/api/notifications/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      const result = await response.json()
      if (result.exists) {
        addLog("✅ Subscription exists in database")
      } else {
        addLog("⚠️ Subscription not in database - saving now...")
        await saveSubscriptionToDatabase(subscription)
      }
    } catch (error) {
      addLog(`❌ Database check failed: ${error}`)
    }
  }

  const saveSubscriptionToDatabase = async (subscription: PushSubscription) => {
    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
        }),
      })

      const result = await response.json()
      if (result.success) {
        addLog("✅ Subscription saved to database")
      } else {
        addLog(`❌ Failed to save subscription: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Save subscription error: ${error}`)
    }
  }

  const subscribeToNotifications = async () => {
    setIsLoading(true)
    addLog("🔔 Starting subscription process...")

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      addLog(`📋 Permission: ${permission}`)

      if (permission !== "granted") {
        addLog("❌ Permission denied")
        toast({
          title: "Permission Denied",
          description: "Please allow notifications to receive broadcasts",
          variant: "destructive",
        })
        return
      }

      // Register service worker
      if (!("serviceWorker" in navigator)) {
        addLog("❌ Service Worker not supported")
        return
      }

      addLog("🔧 Registering service worker...")
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready
      addLog("✅ Service worker ready")

      // Get VAPID key
      const vapidResponse = await fetch("/api/notifications/vapid-keys")
      const { publicKey } = await vapidResponse.json()
      addLog(`🔑 Got VAPID key: ${publicKey.substring(0, 20)}...`)

      // Subscribe to push
      addLog("📡 Creating push subscription...")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      })

      addLog("✅ Push subscription created")
      setSubscriptionData(subscription)

      // Save to database
      await saveSubscriptionToDatabase(subscription)

      setIsSubscribed(true)
      addLog("🎉 Successfully subscribed to broadcasts!")

      toast({
        title: "Subscribed!",
        description: "You will now receive broadcast notifications",
      })
    } catch (error) {
      addLog(`❌ Subscription failed: ${error}`)
      toast({
        title: "Subscription Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    addLog("🔕 Unsubscribing...")

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        addLog("✅ Unsubscribed from push")

        // Remove from database
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        addLog("✅ Removed from database")
      }

      setIsSubscribed(false)
      setSubscriptionData(null)
      addLog("🎉 Successfully unsubscribed")

      toast({
        title: "Unsubscribed",
        description: "You will no longer receive broadcast notifications",
      })
    } catch (error) {
      addLog(`❌ Unsubscribe failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testPersonalNotification = async () => {
    if (!subscriptionData) {
      toast({
        title: "Not Subscribed",
        description: "Please subscribe first",
        variant: "destructive",
      })
      return
    }

    addLog("🧪 Testing personal notification...")

    try {
      const response = await fetch("/api/notifications/test-personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscriptionData.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscriptionData.getKey("p256dh")!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscriptionData.getKey("auth")!))),
            },
          },
        }),
      })

      const result = await response.json()
      if (result.success) {
        addLog("✅ Personal test notification sent!")
      } else {
        addLog(`❌ Personal test failed: ${result.error}`)
      }
    } catch (error) {
      addLog(`❌ Personal test error: ${error}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-5 w-5 text-green-600" /> : <BellOff className="h-5 w-5 text-gray-400" />}
          Broadcast Subscription
        </CardTitle>
        <CardDescription>
          {isSubscribed
            ? "You are subscribed to broadcast notifications"
            : "Subscribe to receive broadcast notifications"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Status */}
        <Alert>
          {isSubscribed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            <strong>Status:</strong> {isSubscribed ? "Subscribed ✅" : "Not Subscribed ❌"}
            {subscriptionData && (
              <div className="mt-2 text-xs">
                <strong>Endpoint:</strong> {subscriptionData.endpoint.substring(0, 50)}...
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button onClick={subscribeToNotifications} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bell className="h-4 w-4 mr-2" />}
              Subscribe to Broadcasts
            </Button>
          ) : (
            <>
              <Button onClick={testPersonalNotification} variant="outline" className="flex-1">
                🧪 Test My Subscription
              </Button>
              <Button onClick={unsubscribe} variant="destructive" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BellOff className="h-4 w-4 mr-2" />}
                Unsubscribe
              </Button>
            </>
          )}
        </div>

        <Button onClick={checkSubscriptionStatus} variant="outline" className="w-full">
          🔄 Refresh Status
        </Button>

        {/* Instructions */}
        <Alert>
          <AlertDescription>
            <div className="space-y-1">
              <p>
                <strong>To receive broadcasts:</strong>
              </p>
              <p>1. Click "Subscribe to Broadcasts"</p>
              <p>2. Allow notifications when browser asks</p>
              <p>3. Test with "Test My Subscription"</p>
              <p>4. Now you'll receive all broadcast notifications!</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Live Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Subscription Logs:</h4>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-600 dark:text-gray-400 font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
