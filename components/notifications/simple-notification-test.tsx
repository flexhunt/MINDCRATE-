"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, CheckCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SimpleNotificationTest() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    checkPermission()
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `${timestamp}: ${message}`
    console.log(logMessage)
    setLogs((prev) => [...prev.slice(-4), logMessage])
  }

  const checkPermission = () => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      addLog(`Current permission: ${Notification.permission}`)
      return true
    } else {
      addLog("❌ Notifications not supported in this browser")
      return false
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

  const showSimpleNotification = () => {
    if (!("Notification" in window)) {
      addLog("❌ Notifications not supported")
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

    addLog("🚀 Creating notification...")

    try {
      const notification = new Notification("🎉 SUCCESS!", {
        body: "This notification is working! You did it!",
        icon: "/logo.png",
        badge: "/logo.png",
        tag: "test-notification",
        requireInteraction: true,
      })

      addLog("✅ Notification created successfully!")

      notification.onclick = () => {
        addLog("👆 Notification clicked!")
        window.focus()
        notification.close()
      }

      notification.onshow = () => {
        addLog("👀 Notification shown!")
      }

      notification.onerror = (error) => {
        addLog(`❌ Notification error: ${error}`)
      }

      notification.onclose = () => {
        addLog("🔒 Notification closed")
      }

      toast({
        title: "Notification Sent!",
        description: "Check above for your notification",
      })
    } catch (error) {
      addLog(`❌ Failed to create notification: ${error}`)
      toast({
        title: "Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      })
    }
  }

  const testEverything = async () => {
    setIsLoading(true)
    addLog("🧪 Starting comprehensive test...")

    try {
      // Step 1: Check support
      if (!checkPermission()) {
        setIsLoading(false)
        return
      }

      // Step 2: Request permission if needed
      if (permission !== "granted") {
        const granted = await requestPermission()
        if (!granted) {
          setIsLoading(false)
          return
        }
      }

      // Step 3: Show notification
      addLog("📱 Showing test notification...")
      showSimpleNotification()

      // Step 4: Try multiple notifications
      setTimeout(() => {
        addLog("📱 Showing second notification...")
        try {
          new Notification("🔔 Second Test", {
            body: "This is the second test notification!",
            icon: "/logo.png",
            tag: "test-2",
          })
          addLog("✅ Second notification sent!")
        } catch (error) {
          addLog(`❌ Second notification failed: ${error}`)
        }
      }, 2000)

      // Step 5: Try with different options
      setTimeout(() => {
        addLog("📱 Showing third notification with actions...")
        try {
          new Notification("🎯 Third Test", {
            body: "This notification has actions!",
            icon: "/logo.png",
            actions: [
              { action: "yes", title: "Yes" },
              { action: "no", title: "No" },
            ],
            tag: "test-3",
          })
          addLog("✅ Third notification sent!")
        } catch (error) {
          addLog(`❌ Third notification failed: ${error}`)
        }
      }, 4000)
    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Simple Notification Test
          </CardTitle>
          <CardDescription>Let's get ONE notification working first!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm">Permission Status:</span>
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

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkPermission} variant="outline" size="sm">
              Check Support
            </Button>

            {permission !== "granted" && (
              <Button onClick={requestPermission} variant="outline" size="sm">
                Request Permission
              </Button>
            )}

            {permission === "granted" && (
              <Button onClick={showSimpleNotification} size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Show Notification
              </Button>
            )}

            <Button onClick={testEverything} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? "Testing..." : "Test Everything"}
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <strong>Step 1:</strong> Click "Test Everything" - it will request permission and show notifications
                </p>
                <p>
                  <strong>Step 2:</strong> Allow notifications when browser asks
                </p>
                <p>
                  <strong>Step 3:</strong> Look for notifications in top-right corner of your screen
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Live Logs */}
          {logs.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Live Logs:</h4>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
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
              <p>Browser: {navigator.userAgent.split(" ")[0]}</p>
              <p>Notifications supported: {"Notification" in window ? "✅ Yes" : "❌ No"}</p>
              <p>Current URL: {window.location.href}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
