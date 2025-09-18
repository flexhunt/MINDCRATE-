"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, ChevronLeft, ChevronRight, Megaphone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Broadcast = {
  id: string
  message: string
  created_at: string
  is_active: boolean
  priority: boolean
}

export default function BroadcastBanner({ userId }: { userId?: string }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Load active broadcasts
    const loadBroadcasts = async () => {
      const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })

      if (data && !error) {
        setBroadcasts(data)
      }
    }

    loadBroadcasts()

    // Subscribe to broadcast changes
    const channel = supabase
      .channel("broadcast-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, (payload) => {
        loadBroadcasts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Mark broadcast as read when user dismisses it
  const markAsRead = async (broadcastId: string) => {
    if (!userId) return

    await supabase.from("broadcast_reads").insert({
      broadcast_id: broadcastId,
      user_id: userId,
    })
  }

  const dismissBroadcast = () => {
    if (broadcasts[currentIndex]) {
      markAsRead(broadcasts[currentIndex].id)
    }
    setVisible(false)
  }

  const nextBroadcast = () => {
    if (currentIndex < broadcasts.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevBroadcast = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // If no broadcasts or not visible, don't render anything
  if (broadcasts.length === 0 || !visible) return null

  const currentBroadcast = broadcasts[currentIndex]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`w-full ${
            currentBroadcast.priority ? "bg-purple-600 dark:bg-purple-800" : "bg-blue-600 dark:bg-blue-800"
          } text-white z-40`}
        >
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Megaphone className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm font-medium line-clamp-2">{currentBroadcast.message}</p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {broadcasts.length > 1 && (
                <>
                  <button
                    onClick={prevBroadcast}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous broadcast"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs px-1">
                    {currentIndex + 1}/{broadcasts.length}
                  </span>
                  <button
                    onClick={nextBroadcast}
                    disabled={currentIndex === broadcasts.length - 1}
                    className="p-1 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next broadcast"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              <button onClick={dismissBroadcast} className="p-1 rounded-full hover:bg-white/20" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
