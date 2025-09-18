"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, AlertCircle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

type Broadcast = {
  id: string
  title: string
  message: string
  created_at: string
  importance: string
  admin_id: string
  is_active: boolean
  read_by: string[]
}

export default function BroadcastNotification({ userId }: { userId: string }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [currentBroadcast, setCurrentBroadcast] = useState<Broadcast | null>(null)
  const [showNotification, setShowNotification] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showUnreadIndicator, setShowUnreadIndicator] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  // Load broadcasts
  const loadBroadcasts = async () => {
    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading broadcasts:", error)
    } else if (data) {
      setBroadcasts(data)

      // Count unread broadcasts
      const unread = data.filter((broadcast) => !broadcast.read_by?.includes(userId))
      setUnreadCount(unread.length)
      setShowUnreadIndicator(unread.length > 0)

      // Show the most recent unread broadcast if available
      if (unread.length > 0 && !currentBroadcast) {
        setCurrentBroadcast(unread[0])
        setShowNotification(true)
        playNotificationSound(unread[0].importance)
      }
    }
  }

  useEffect(() => {
    if (userId) {
      loadBroadcasts()

      // Subscribe to broadcast changes
      const channel = supabase
        .channel("public-broadcasts")
        .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, (payload) => {
          if (payload.eventType === "INSERT") {
            // Show new broadcast immediately
            const newBroadcast = payload.new as Broadcast
            if (newBroadcast.is_active) {
              setCurrentBroadcast(newBroadcast)
              setShowNotification(true)
              setUnreadCount((prev) => prev + 1)
              setShowUnreadIndicator(true)
              playNotificationSound(newBroadcast.importance)
            }
          }
          loadBroadcasts()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  const markAsRead = async (broadcastId: string) => {
    if (!userId) return

    // Call the function to mark as read
    const { error } = await supabase.rpc("mark_broadcast_read", {
      broadcast_id: broadcastId,
    })

    if (error) {
      console.error("Error marking broadcast as read:", error)
    } else {
      // Update local state
      setBroadcasts((prev) =>
        prev.map((b) =>
          b.id === broadcastId
            ? {
                ...b,
                read_by: b.read_by ? [...b.read_by, userId] : [userId],
              }
            : b,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
      if (unreadCount <= 1) {
        setShowUnreadIndicator(false)
      }
    }
  }

  const dismissNotification = () => {
    if (currentBroadcast) {
      markAsRead(currentBroadcast.id)
    }
    setShowNotification(false)
    setCurrentBroadcast(null)
  }

  const showNextBroadcast = () => {
    dismissNotification()

    // Find next unread broadcast
    const unread = broadcasts.filter((broadcast) => !broadcast.read_by?.includes(userId))
    if (unread.length > 0) {
      setCurrentBroadcast(unread[0])
      setShowNotification(true)
      playNotificationSound(unread[0].importance)
    }
  }

  const toggleUnreadBroadcasts = () => {
    if (showNotification) {
      dismissNotification()
    } else {
      const unread = broadcasts.filter((broadcast) => !broadcast.read_by?.includes(userId))
      if (unread.length > 0) {
        setCurrentBroadcast(unread[0])
        setShowNotification(true)
        playNotificationSound(unread[0].importance)
      }
    }
  }

  const playNotificationSound = (importance: string) => {
    if (!audioRef.current) return

    // Set volume based on importance
    switch (importance) {
      case "critical":
        audioRef.current.volume = 1.0
        break
      case "high":
        audioRef.current.volume = 0.8
        break
      case "medium":
        audioRef.current.volume = 0.6
        break
      case "low":
      default:
        audioRef.current.volume = 0.4
        break
    }

    audioRef.current.play().catch((error) => {
      console.error("Error playing notification sound:", error)
    })
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-blue-500"
      case "low":
      default:
        return "bg-green-500"
    }
  }

  return (
    <>
      {/* Audio element for notification sound */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      {/* Floating unread indicator */}
      {showUnreadIndicator && !showNotification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={toggleUnreadBroadcasts}
            className="rounded-full h-12 w-12 flex items-center justify-center shadow-lg"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 rounded-full">
              {unreadCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Notification popup */}
      <AnimatePresence>
        {showNotification && currentBroadcast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 mx-auto p-4 max-w-2xl"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className={`h-1 ${getImportanceColor(currentBroadcast.importance)}`} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle
                      className={`h-5 w-5 ${
                        currentBroadcast.importance === "critical"
                          ? "text-red-500"
                          : currentBroadcast.importance === "high"
                            ? "text-orange-500"
                            : currentBroadcast.importance === "medium"
                              ? "text-blue-500"
                              : "text-green-500"
                      }`}
                    />
                    <h3 className="font-bold">{currentBroadcast.title}</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={dismissNotification}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm mb-4">{currentBroadcast.message}</p>
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={dismissNotification}>
                    Dismiss
                  </Button>
                  {unreadCount > 1 && (
                    <Button variant="outline" size="sm" onClick={showNextBroadcast}>
                      Next ({unreadCount - 1})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
