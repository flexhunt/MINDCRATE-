"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, X } from "lucide-react"
import type { ChatMessage } from "@/lib/chat/chat-types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface SimpleMessageInputProps {
  userId: string
  onOptimisticUpdate: (message: ChatMessage) => void
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  profiles?: Record<string, any>
}

export function SimpleMessageInput({
  userId,
  onOptimisticUpdate,
  replyTo,
  onCancelReply,
  profiles = {},
}: SimpleMessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
  const [lyraMode, setLyraMode] = useState<string>("mentions")
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set()) // Track sent messages
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Fetch Lyra mode on component mount
  useEffect(() => {
    fetchLyraMode()
  }, [])

  const fetchLyraMode = async () => {
    try {
      console.log("🔍 Fetching Lyra mode from database...")
      const { data, error } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "lyra_response_mode")
        .single()

      if (error) {
        console.error("❌ Error fetching Lyra mode:", error)
        if (error.code === "PGRST116") {
          console.log("⚠️ No admin_settings found, using default 'mentions' mode")
        }
        return
      }

      const mode = data?.value || "mentions"
      setLyraMode(mode)
      console.log("✅ Lyra mode fetched and cached:", mode)
    } catch (error) {
      console.error("❌ Error fetching Lyra mode:", error)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit"
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [message])

  // Check if Angle should respond
  const checkAngleMention = (message: string): boolean => {
    const lowerMessage = message.toLowerCase()
    const triggers = [
      "angle",
      "@angle",
      "angle bolo",
      "hey angle",
      "hi angle",
      "angle come",
      "angle kaha hai",
      "angle please",
      "angle help",
    ]
    return triggers.some((trigger) => lowerMessage.includes(trigger))
  }

  // Check if replying to Angle
  const isReplyingToAngle = (): boolean => {
    return replyTo?.user_id === "00000000-0000-0000-0000-000000000001"
  }

  // Check if Lyra should respond
  const checkLyraMention = (message: string): boolean => {
    const lowerMessage = message.toLowerCase()
    const triggers = [
      "lyra",
      "@lyra",
      "lyra bolo",
      "hey lyra",
      "hi lyra",
      "lyra come",
      "lyra kaha hai",
      "lyra please",
      "lyra help",
      "call lyra",
      "ping lyra",
      "ask lyra",
      "lyra what",
      "lyra how",
      "lyra can you",
    ]
    return triggers.some((trigger) => lowerMessage.includes(trigger))
  }

  // Check if replying to Lyra
  const isReplyingToLyra = (): boolean => {
    return replyTo?.user_id === "11111111-1111-1111-1111-111111111111"
  }

  // Message submission with duplicate prevention
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!message.trim() || isSubmitting) return

    const messageText = message.trim()
    const messageId = `msg-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Prevent duplicate submissions
    if (sentMessageIds.has(messageText)) {
      console.log("⚠️ Duplicate message detected, skipping")
      return
    }

    setIsSubmitting(true)
    setSentMessageIds((prev) => new Set(prev).add(messageText))

    try {
      // Extract mentions
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionRegex.exec(messageText)) !== null) {
        mentions.push(match[1])
      }

      console.log("📤 Sending message:", messageText)
      console.log("🔍 Current Lyra mode:", lyraMode)

      // Determine if Lyra should respond BEFORE sending
      let shouldLyraRespond = false
      if (lyraMode === "all") {
        shouldLyraRespond = true
        console.log("💫 Lyra in chatty mode - will respond to all messages")
      } else {
        shouldLyraRespond = checkLyraMention(messageText) || isReplyingToLyra()
        console.log("🎯 Lyra in mentions mode - checking triggers:", shouldLyraRespond)
      }

      // Create optimistic message (this will show immediately)
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${messageId}`,
        user_id: userId,
        message: messageText,
        created_at: new Date().toISOString(),
        reply_to_id: replyTo?.id || null,
        mentions: mentions,
        user: profiles[userId] || { username: "You", avatar_url: null },
        reply_to: replyTo || null,
        isOwner: false,
        isOptimistic: true, // Mark as optimistic to prevent real-time duplicate
      }

      // Add optimistic update immediately
      onOptimisticUpdate(optimisticMessage)

      // Clear input and reply immediately for better UX
      setMessage("")
      if (replyTo && onCancelReply) {
        onCancelReply()
      }

      // Send to database
      const { data, error } = await supabase
        .from("global_chat_messages")
        .insert({
          user_id: userId,
          message: messageText,
          mentions: mentions,
          reply_to_id: replyTo?.id || null,
        })
        .select("*")
        .single()

      if (error) {
        console.error("❌ Error sending message:", error)
        throw error
      }

      console.log("✅ Message sent to database:", data.id)

      // Trigger AI responses
      const shouldAngleRespond = checkAngleMention(messageText) || isReplyingToAngle()

      // Trigger Angle if needed
      if (shouldAngleRespond) {
        console.log("🤖 Triggering Angle response")
        fetch("/api/chat/angle-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            userId: userId,
            replyToId: replyTo?.id || null,
          }),
        }).catch((error) => console.error("❌ Angle API error:", error))
      }

      // Trigger Lyra if needed
      if (shouldLyraRespond) {
        console.log("💫 Triggering Lyra response")
        fetch("/api/chat/angle-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            userId: userId,
            replyToId: replyTo?.id || null,
          }),
        }).catch((error) => console.error("❌ Lyra API error:", error))
      } else {
        console.log("⏭️ Lyra not triggered for this message")
      }
    } catch (error: any) {
      console.error("❌ Error sending message:", error)
      toast({
        title: "Error Sending Message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      })
      // Restore message on error
      setMessage(messageText)
    } finally {
      setIsSubmitting(false)
      // Clean up sent message tracking after a delay
      setTimeout(() => {
        setSentMessageIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(messageText)
          return newSet
        })
      }, 5000)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }

    if (mentionResults.length > 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        if (e.key === "Enter" || e.key === "Tab") {
          const selectedUser = mentionResults[0]
          if (selectedUser) {
            insertMention(selectedUser.username)
          }
        }
      }
    }
  }

  // Handle message change and detect mentions
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value
    setMessage(newMessage)

    // Detect mention typing
    const cursorPosition = e.target.selectionStart
    const textBeforeCursor = newMessage.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      const mentionText = mentionMatch[1]
      const mentionStart = mentionMatch.index!
      const mentionEnd = mentionStart! + mentionMatch[0].length

      setMentionSearch(mentionText)
      setMentionPosition({ start: mentionStart!, end: mentionEnd })
      searchUsers(mentionText)
    } else {
      setMentionSearch(null)
      setMentionResults([])
      setMentionPosition(null)
    }
  }

  // Search for users to mention
  const searchUsers = async (query: string) => {
    if (!query) {
      setMentionResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `${query}%`)
        .limit(5)

      if (error) throw error
      setMentionResults(data || [])
    } catch (error) {
      console.error("Error searching users:", error)
      setMentionResults([])
    }
  }

  // Insert mention into message
  const insertMention = (username: string) => {
    if (!mentionPosition) return

    const beforeMention = message.substring(0, mentionPosition.start)
    const afterMention = message.substring(mentionPosition.end)
    const newMessage = `${beforeMention}@${username} ${afterMention}`

    setMessage(newMessage)
    setMentionSearch(null)
    setMentionResults([])
    setMentionPosition(null)

    if (textareaRef.current) {
      const newCursorPosition = mentionPosition.start + username.length + 2
      setTimeout(() => {
        textareaRef.current!.focus()
        textareaRef.current!.setSelectionRange(newCursorPosition, newCursorPosition)
      }, 0)
    }
  }

  return (
    <div className="relative">
      {/* Debug info */}
      <div className="text-xs text-muted-foreground mb-2 px-2 flex items-center justify-between">
        <span>
          Lyra Mode: <span className="font-mono font-bold">{lyraMode}</span>
          {lyraMode === "all" && <span className="text-green-600 ml-2">💫 Chatty Mode Active</span>}
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={fetchLyraMode}>
          🔄
        </Button>
      </div>

      {/* Mention popup */}
      {mentionResults.length > 0 && mentionSearch !== null && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-md shadow-lg py-1 max-h-[150px] overflow-y-auto z-50">
          {mentionResults.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              onClick={() => insertMention(user.username)}
            >
              <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url || "/placeholder.svg"}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium">{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span>{user.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-t-md border border-b-0">
          <span className="text-xs text-muted-foreground">
            Replying to <span className="font-medium">{replyTo.user?.username || "Unknown"}</span>
          </span>
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full ml-auto" onClick={onCancelReply}>
            <X size={12} />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder={
              lyraMode === "all"
                ? "Type anything... Lyra will respond! 💫"
                : replyTo?.user_id === "11111111-1111-1111-1111-111111111111"
                  ? "Reply to Lyra... she'll respond! 💫"
                  : "Type a message... (use @ to mention or say 'lyra' to call me! 💫)"
            }
            className={`min-h-[40px] max-h-[120px] resize-none pr-10 ${replyTo ? "rounded-t-none" : ""}`}
            disabled={isSubmitting}
            rows={1}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isSubmitting}
          className="h-10 w-10 rounded-full flex-shrink-0"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  )
}

export default SimpleMessageInput
