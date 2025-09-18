"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, X, Smile } from "lucide-react"
import type { ChatMessage } from "@/lib/chat/chat-types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { debounce } from "@/lib/utils"

interface EnhancedMessageInputProps {
  userId: string
  onOptimisticUpdate: (message: ChatMessage) => void
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  profiles?: Record<string, any>
}

const quickEmojis = ["😀", "😂", "❤️", "👍", "👎", "😢", "😮", "😡", "🎉", "🔥", "💯", "👏"]

export function EnhancedMessageInput({
  userId,
  onOptimisticUpdate,
  replyTo,
  onCancelReply,
  profiles = {},
}: EnhancedMessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [mentionResults, setMentionResults] = useState<any[]>([])
  const [mentionPosition, setMentionPosition] = useState<{ start: number; end: number } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const [optimisticMessageIds, setOptimisticMessageIds] = useState<Set<string>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Get Lyra's current response mode
  const getLyraResponseMode = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "lyra_response_mode")
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching Lyra mode:", error)
        return "mentions" // default fallback
      }

      return data?.value || "mentions"
    } catch (error) {
      console.error("Error fetching Lyra mode:", error)
      return "mentions"
    }
  }

  // Enhanced message submission with duplicate prevention
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!message.trim() || isSubmitting) return

    const messageText = message.trim()
    setIsSubmitting(true)

    try {
      // Extract mentions
      const mentionRegex = /@(\w+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionRegex.exec(messageText)) !== null) {
        mentions.push(match[1])
      }

      console.log("📤 Sending message with mentions:", mentions)

      // Create optimistic message with unique ID for tracking
      const optimisticId = `optimistic-${userId}-${Date.now()}-${Math.random()}`
      const optimisticMessage: ChatMessage = {
        id: optimisticId,
        user_id: userId,
        message: messageText,
        created_at: new Date().toISOString(),
        reply_to_id: replyTo?.id || null,
        mentions: mentions,
        user: profiles[userId] || { username: "You", avatar_url: null },
        reply_to: replyTo || null,
        isOwner: false,
        isOptimistic: true, // Mark as optimistic
      }

      // Track optimistic message ID
      setOptimisticMessageIds((prev) => new Set(prev).add(optimisticId))

      // Add optimistic update
      onOptimisticUpdate(optimisticMessage)

      // Clear input and reply
      setMessage("")
      if (replyTo && onCancelReply) {
        onCancelReply()
      }

      // Send message to database
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
        // Remove failed optimistic message
        setOptimisticMessageIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(optimisticId)
          return newSet
        })
        throw error
      }

      console.log("✅ Message sent successfully:", data)

      // Check if Angle should respond
      const shouldAngleRespond = checkAngleMention(messageText) || isReplyingToAngle()
      if (shouldAngleRespond) {
        try {
          console.log("🤖 Triggering Angle response")
          const response = await fetch("/api/chat/angle-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: messageText,
              userId: userId,
              replyToId: replyTo?.id || null,
            }),
          })

          if (!response.ok) {
            console.error("❌ Angle API error")
          } else {
            console.log("✅ Angle response triggered")
          }
        } catch (error) {
          console.error("❌ Error triggering Angle response:", error)
        }
      }

      // Get Lyra's response mode and check if she should respond
      const lyraMode = await getLyraResponseMode()
      console.log("🔍 Lyra mode:", lyraMode)

      let shouldLyraRespond = false

      if (lyraMode === "all") {
        // In chatty mode, Lyra responds to ALL messages (except her own)
        shouldLyraRespond = true
        console.log("💫 Lyra in chatty mode - will attempt to respond to all messages")
      } else {
        // In mentions mode, only respond to mentions/replies
        shouldLyraRespond = checkLyraMention(messageText) || isReplyingToLyra()
        console.log("🎯 Lyra in mentions mode - checking for triggers:", shouldLyraRespond)
      }

      if (shouldLyraRespond) {
        try {
          console.log("💫 Triggering Lyra response")
          const response = await fetch("/api/chat/angle-response", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: messageText,
              userId: userId,
              replyToId: replyTo?.id || null,
              isLyra: true, // Flag for Lyra
            }),
          })

          if (!response.ok) {
            console.error("❌ Lyra API error")
          } else {
            console.log("✅ Lyra response triggered")
          }
        } catch (error) {
          console.error("❌ Error triggering Lyra response:", error)
        }
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
      setMessage(messageText)
    } finally {
      setIsSubmitting(false)
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

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    const cursorPosition = textareaRef.current?.selectionStart || message.length
    const beforeCursor = message.substring(0, cursorPosition)
    const afterCursor = message.substring(cursorPosition)
    const newMessage = beforeCursor + emoji + afterCursor

    setMessage(newMessage)
    setShowEmojiPicker(false)

    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPosition = cursorPosition + emoji.length
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // Send quick message
  const sendQuickMessage = (quickMsg: string) => {
    setMessage(quickMsg)
    setTimeout(() => {
      handleSubmit()
    }, 100)
  }

  // Track and broadcast typing status
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !userId) return

    const presenceChannel = supabase.channel("online-users")

    // Create debounced typing function
    const debouncedStopTyping = debounce(() => {
      if (presenceChannel) {
        presenceChannel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          typing: false,
        })
        setIsTyping(false)
      }
    }, 2000)

    // Update typing status when message changes
    if (message.trim().length > 0 && !isTyping) {
      setIsTyping(true)
      presenceChannel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        typing: true,
      })
    } else if (message.trim().length === 0 && isTyping) {
      setIsTyping(false)
      presenceChannel.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        typing: false,
      })
    }

    // Reset typing status after delay
    if (message.trim().length > 0) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      debouncedStopTyping()
    }

    return () => {
      debouncedStopTyping.cancel()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, userId, isTyping, mounted])

  return (
    <div className="relative">
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

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-md shadow-lg p-3 z-50">
          <div className="grid grid-cols-6 gap-2 mb-3">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="p-2 text-lg hover:bg-muted rounded-md transition-colors"
                onClick={() => addEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="border-t pt-2">
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
                onClick={() => sendQuickMessage("👋 Hello everyone!")}
              >
                👋 Hello
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
                onClick={() => sendQuickMessage("Thanks! 🙏")}
              >
                🙏 Thanks
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
                onClick={() => sendQuickMessage("Good morning! ☀️")}
              >
                ☀️ Good morning
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
                onClick={() => sendQuickMessage("Good night! 🌙")}
              >
                🌙 Good night
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-t-xl border border-b-0">
          <div className="flex-1">
            <div className="text-xs font-medium text-primary mb-1">
              Replying to {replyTo.user?.username || "Unknown"}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-1">{replyTo.message}</div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onCancelReply}>
            <X size={16} />
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyPress}
            placeholder={
              replyTo?.user_id === "11111111-1111-1111-1111-111111111111"
                ? "Reply to Lyra... she'll respond! 💫"
                : "Type a message... (use @ to mention, say 'lyra' to call me! 💫)"
            }
            className={`h-12 min-h-[48px] max-h-[48px] resize-none pr-12 rounded-full border-2 bg-muted/30 focus:bg-background transition-colors overflow-hidden ${replyTo ? "rounded-t-none" : ""}`}
            disabled={isSubmitting}
            rows={1}
            style={{ lineHeight: "1.2" }}
          />

          {/* Input actions */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={16} />
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isSubmitting}
          className="h-12 w-12 rounded-full flex-shrink-0 shadow-md hover:shadow-lg transition-shadow"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  )
}

export default EnhancedMessageInput
