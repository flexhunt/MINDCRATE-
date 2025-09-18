"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

type Broadcast = {
  id: string
  message: string
  created_at: string
  is_active: boolean
  priority: boolean
}

type BroadcastContextType = {
  broadcasts: Broadcast[]
  hasUnreadBroadcasts: boolean
  markAsRead: (broadcastId: string) => Promise<void>
}

const BroadcastContext = createContext<BroadcastContextType>({
  broadcasts: [],
  hasUnreadBroadcasts: false,
  markAsRead: async () => {},
})

export const useBroadcast = () => useContext(BroadcastContext)

export function BroadcastProvider({ children }: { children: React.ReactNode }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [readBroadcasts, setReadBroadcasts] = useState<string[]>([])
  const [hasUnreadBroadcasts, setHasUnreadBroadcasts] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()
    let channel: any = null

    const loadBroadcasts = async () => {
      try {
        // Get user session
        const { data: sessionData } = await supabase.auth.getSession()
        const userId = sessionData.session?.user?.id

        if (!userId) return

        // Get active broadcasts
        const { data: broadcastsData, error: broadcastsError } = await supabase
          .from("broadcasts")
          .select("*")
          .eq("is_active", true)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false })

        if (broadcastsError) {
          console.error("Error loading broadcasts:", broadcastsError)
          return
        }

        // Get read broadcasts for this user
        const { data: readsData, error: readsError } = await supabase
          .from("broadcast_reads")
          .select("broadcast_id")
          .eq("user_id", userId)

        if (readsError) {
          console.error("Error loading read broadcasts:", readsError)
          return
        }

        const readIds = readsData?.map((read) => read.broadcast_id) || []
        setReadBroadcasts(readIds)

        // Check if there are any unread broadcasts
        const hasUnread = broadcastsData?.some((broadcast) => !readIds.includes(broadcast.id)) || false
        setHasUnreadBroadcasts(hasUnread)

        setBroadcasts(broadcastsData || [])
      } catch (error) {
        console.error("Error in loadBroadcasts:", error)
      }
    }

    const setupSubscription = async () => {
      try {
        // Subscribe to broadcast changes
        channel = supabase
          .channel("public-broadcasts")
          .on("postgres_changes", { event: "*", schema: "public", table: "broadcasts" }, () => {
            loadBroadcasts()
          })
          .subscribe()

        await loadBroadcasts()
      } catch (error) {
        console.error("Error setting up broadcast subscription:", error)
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (error) {
          console.error("Error removing broadcast channel:", error)
        }
      }
    }
  }, [mounted])

  const markAsRead = async (broadcastId: string) => {
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id

      if (!userId) return

      // Insert into broadcast_reads
      const { error } = await supabase.from("broadcast_reads").insert({
        broadcast_id: broadcastId,
        user_id: userId,
      })

      if (error && error.code !== "23505") {
        // Ignore unique violation errors (already read)
        console.error("Error marking broadcast as read:", error)
        return
      }

      // Update local state
      setReadBroadcasts([...readBroadcasts, broadcastId])

      // Check if there are still unread broadcasts
      const hasUnread = broadcasts.some(
        (broadcast) => !readBroadcasts.includes(broadcast.id) && broadcast.id !== broadcastId,
      )
      setHasUnreadBroadcasts(hasUnread)
    } catch (error) {
      console.error("Error in markAsRead:", error)
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <BroadcastContext.Provider value={{ broadcasts, hasUnreadBroadcasts, markAsRead }}>
      {children}
    </BroadcastContext.Provider>
  )
}

export default BroadcastProvider
