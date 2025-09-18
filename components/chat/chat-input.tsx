"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast/use-toast"

interface ChatInputProps {
  userId: string
}

export function ChatInput({ userId }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastMessageTime = useRef<Date | null>(null)
  const messageCount = useRef(0)
  const { toast } = useToast()
  const supabase = createClient()

  const MAX_MESSAGE_LENGTH = 150
  const RATE_LIMIT_COUNT = 5
  const RATE_LIMIT_WINDOW = 10000 // 10 seconds

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!message.trim()) return

      // Check message length
      if (message.length > MAX_MESSAGE_LENGTH) {
        toast({
          title: "Message too long",
          description: `Messages cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
          variant: "destructive",
        })
        return
      }

      // Check rate limit
      const now = new Date()
      if (lastMessageTime.current) {
        if (
          messageCount.current >= RATE_LIMIT_COUNT &&
          now.getTime() - lastMessageTime.current.getTime() < RATE_LIMIT_WINDOW
        ) {
          toast({
            title: "Slow down",
            description: `You can only send ${RATE_LIMIT_COUNT} messages every ${RATE_LIMIT_WINDOW / 1000} seconds.`,
            variant: "destructive",
          })
          return
        }

        if (now.getTime() - lastMessageTime.current.getTime() >= RATE_LIMIT_WINDOW) {
          // Reset counter if window has passed
          messageCount.current = 0
        }
      }

      setIsSubmitting(true)

      try {
        // Insert message into chat_messages table
        const { error: insertError } = await supabase
          .from("chat_messages")
          .insert({ user_id: userId, message: message.trim() })

        if (insertError) {
          throw new Error(insertError.message)
        }

        // Add activity score for sending a message
        await fetch("/api/ranks/add-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityType: "chat_message", score: 1 }),
        })

        // Update rate limiting
        lastMessageTime.current = now
        messageCount.current += 1

        // Clear input
        setMessage("")
      } catch (error) {
        console.error("Error sending message:", error)
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [message, userId, toast, supabase],
  )

  return (
    <form onSubmit={handleSubmit} className="border-t p-2 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          maxLength={MAX_MESSAGE_LENGTH}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
      <div className="text-xs text-right text-gray-500 mt-1">
        {message.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </form>
  )
}
