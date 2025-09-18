"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InstantNotificationButton() {
  const [canNotify, setCanNotify] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if notifications are supported and permitted
    if (typeof window !== "undefined" && "Notification" in window) {
      setCanNotify(Notification.permission === "granted")
    }
  }, [])

  const showInstantNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: "Not Supported",
        description: "Notifications not supported in this browser",
        variant: "destructive",
      })
      return
    }

    try {
      // Request permission if not granted
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          toast({
            title: "Permission Denied",
            description: "Please allow notifications to continue",
            variant: "destructive",
          })
          return
        }
        setCanNotify(true)
      }

      // Show notification
      const notification = new Notification("🚨 INSTANT TEST!", {
        body: "This is an instant notification test!",
        icon: "/logo.png",
        requireInteraction: true,
        tag: "instant-test",
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      toast({
        title: "Notification Sent!",
        description: "Check the top-right corner of your screen",
      })
    } catch (error) {
      console.error("Notification error:", error)
      toast({
        title: "Error",
        description: `Failed to show notification: ${error}`,
        variant: "destructive",
      })
    }
  }

  return (
    <Button onClick={showInstantNotification} className="bg-red-600 hover:bg-red-700 text-white">
      <Bell className="h-4 w-4 mr-2" />
      INSTANT NOTIFICATION
    </Button>
  )
}
