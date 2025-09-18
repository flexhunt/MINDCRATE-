"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ServiceWorkerNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    initializeServiceWorker()
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-9), logMessage])
  }

  const initializeServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      addLog("❌ Service Worker not supported")
      return
    }

    if (!("Notification" in window)) {
      addLog("❌ Notifications not supported")
      return
    }

    try {
      addLog("🔧 Registering Service Worker...")

      // Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      })

      addLog("✅ Service Worker registered successfully!")
      setSwRegistration(registration)

      // Check current permission
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      addLog(`Current permission: ${currentPermission}`)

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      addLog("✅ Service Worker is ready!")
    } catch (error) {
      addLog(`❌ Service Worker registration failed: ${error}`)
    }
  }

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      addLog("❌ Notifications not supported")
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      })
      return false
    }

    addLog("🔔 Requesting notification permission...")

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      addLog(`Permission result: ${permission}`)

      if (permission === "granted") {
        addLog("✅ Permission granted!")
        toast({
          title: "Permission Granted!",
          description: "You can now receive notifications",
        })
        return true
      } else {
        addLog("❌ Permission denied")
        toast({
          title: "Permission Denied",
          description: "Please allow notifications in your browser",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      addLog(`❌ Permission request failed: ${error}`)
      return false
    }
  }

  const showServiceWorkerNotification = async () => {
    if (!swRegistration) {
      addLog("❌ Service Worker not registered")
      return
    }

    if (Notification.permission !== "granted") {
      addLog("❌ Permission not granted")
      toast({
        title: "Permission Required",
        description: "Please allow notifications first",
        variant: "destructive",
      })
      return
    }

    addLog("🚀 Creating notification via Service Worker...")

    try {
      await swRegistration.showNotification("🎉 SUCCESS!", {
        body: "This notification is working via Service Worker!",
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "sw-test",
        requireInteraction: true,
        actions: [
          {
            action: "open",
            title: "Open App",
          },
          {
            action: "close",
            title: "Close",
          },
        ],
        data: {
          url: "/",
          timestamp: Date.now(),
        },
      })

      addLog("✅ Service Worker notification created successfully!")
      toast({
        title: "Notification Sent!",
        description: "Check the top-right corner of your screen",
      })
    } catch (error) {
      addLog(`❌ Failed to create SW notification: ${error}`)
      toast({
        title: "Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      })
    }
  }

  const showMultipleNotifications = async () => {
    if (!swRegistration || Notification.permission !== "granted") {
      addLog("❌ Service Worker not ready or permission not granted")
      return
    }

    addLog("📱 Showing multiple notifications...")

    const notifications = [
      {
        title: "🔔 Notification #1",
        body: "This is the first test notification!",
        tag: "multi-1",
      },
      {
        title: "🔔 Notification #2",
        body: "This is the second test notification!",
        tag: "multi-2",
      },
      {
        title: "🎯 Final Test",
        body: "This is the final test notification!",
        tag: "multi-3",
      },
    ]

    for (let i = 0; i < notifications.length; i++) {
      setTimeout(async () => {
        try {
          await swRegistration.showNotification(notifications[i].title, {
            body: notifications[i].body,
            icon: "/logo.png",
            tag: notifications[i].tag,
            requireInteraction: i === notifications.length - 1, // Only last one requires interaction
          })
          addLog(`✅ Notification ${i + 1} sent successfully!`)
        } catch (error) {
          addLog(`❌ Notification ${i + 1} failed: ${error}`)
        }
      }, i * 2000)
    }
  }

  const testEverything = async () => {
    setIsLoading(true)
    addLog("🧪 Starting comprehensive Service Worker test...")

    try {
      // Step 1: Initialize Service Worker
      if (!swRegistration) {
        addLog("🔧 Initializing Service Worker...")
        await initializeServiceWorker()
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait a bit
      }

      // Step 2: Request permission if needed
      if (permission !== "granted") {
        addLog("📋 Requesting permission...")
        const granted = await requestPermission()
        if (!granted) {
          setIsLoading(false)
          return
        }
      }

      // Step 3: Show test notification
      addLog("📱 Showing Service Worker notification...")
      await showServiceWorkerNotification()

      // Step 4: Wait and show multiple notifications
      setTimeout(() => {
        addLog("📱 Showing multiple notifications...")
        showMultipleNotifications()
      }, 3000)

      addLog("✅ Comprehensive test completed!")
    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessageToServiceWorker = () => {
    if (!navigator.serviceWorker.controller) {
      addLog("❌ No active service worker")
      return
    }

    addLog("💬 Sending message to Service Worker...")

    navigator.serviceWorker.controller.postMessage({
      type: "TEST_NOTIFICATION",
      notification: {
        title: "🧪 SW Message Test",
        body: "This notification came from a message to the service worker!",
        icon: "/logo.png",
        url: "/",
      },
    })

    addLog("✅ Message sent to Service Worker!")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Service Worker Notifications
          </CardTitle>
          <CardDescription>Using Service Worker API for notifications (required by your browser)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span>Permission:</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  permission === "granted"
                    ? "bg-green-100 text-green-800"
                    : permission === "denied"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {permission}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Service Worker:</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  swRegistration ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {swRegistration ? "✅ Ready" : "❌ Not Ready"}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={initializeServiceWorker} variant="outline" size="sm">
              Initialize SW
            </Button>

            {permission !== "granted" && (
              <Button onClick={requestPermission} variant="outline" size="sm">
                Request Permission
              </Button>
            )}

            {permission === "granted" && swRegistration && (
              <>
                <Button onClick={showServiceWorkerNotification} size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Show Notification
                </Button>
                <Button onClick={showMultipleNotifications} variant="outline" size="sm">
                  Multiple Tests
                </Button>
                <Button onClick={sendMessageToServiceWorker} variant="outline" size="sm">
                  SW Message Test
                </Button>
              </>
            )}

            <Button onClick={testEverything} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {isLoading ? "Testing..." : "Test Everything"}
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Your browser requires Service Worker for notifications!</strong>
                </p>
                <p>
                  <strong>Step 1:</strong> Click "Test Everything" to initialize everything
                </p>
                <p>
                  <strong>Step 2:</strong> Allow notifications when browser asks
                </p>
                <p>
                  <strong>Step 3:</strong> Look for notifications in top-right corner
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Live Logs:</h4>
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-600 dark:text-gray-400 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browser Info */}
          {isClient && (
            <div className="text-xs text-muted-foreground">
              <p>Service Worker supported: {"serviceWorker" in navigator ? "✅ Yes" : "❌ No"}</p>
              <p>Notifications supported: {"Notification" in window ? "✅ Yes" : "❌ No"}</p>
              <p>Current URL: {window.location.href}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
