"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import type { EnhancedChatService } from "@/lib/chat/enhanced-chat-utils"

interface MessageSeenStatusProps {
  messageId: string
  messageUserId: string
  currentUserId: string | null
  chatService: EnhancedChatService
}

export function MessageSeenStatus({ messageId, messageUserId, currentUserId, chatService }: MessageSeenStatusProps) {
  const [seenCount, setSeenCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Only show seen status for the current user's messages and not for optimistic messages
  const shouldShow = messageUserId === currentUserId && !messageId.startsWith("optimistic-")

  useEffect(() => {
    if (!shouldShow || !messageId) return

    let isMounted = true
    const fetchSeenData = async () => {
      try {
        setIsLoading(true)
        const count = await chatService.getMessageSeenCount(messageId)

        if (isMounted) {
          setSeenCount(count > 0 ? count - 1 : 0) // Subtract 1 to exclude the sender
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching seen data:", error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSeenData()

    // Subscribe to seen status updates
    const subscription = chatService.subscribeToMessageSeen((data) => {
      if (data.message_id === messageId && isMounted) {
        fetchSeenData()
      }
    })

    return () => {
      isMounted = false
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe()
      }
    }
  }, [messageId, chatService, shouldShow])

  if (!shouldShow || isLoading) return null

  return (
    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
      <Check size={12} className={seenCount > 0 ? "text-blue-500" : ""} />
      {seenCount > 0 && <span>{seenCount === 1 ? "Seen" : `Seen by ${seenCount}`}</span>}
    </div>
  )
}
