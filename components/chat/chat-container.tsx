"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage } from "@/lib/chat/chat-types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowDown, RefreshCw, Users, WifiOff, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EnhancedMessageInput } from "./enhanced-message-input"
import { Input } from "@/components/ui/input"
import { TelegramMessageGroup } from "./telegram-message-group"

interface ChatContainerProps {
  userId: string
  initialMessages?: ChatMessage[]
  userProfiles?: Record<string, any>
}

export function ChatContainer({ userId, initialMessages = [], userProfiles = {} }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [filteredMessages, setFilteredMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Record<string, any>>(userProfiles)
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [owners, setOwners] = useState<Record<string, boolean>>({})
  const [username, setUsername] = useState<string>("")
  const [currentUserIsOwner, setCurrentUserIsOwner] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<number>(0)
  const [mounted, setMounted] = useState(false)
  const [presenceState, setPresenceState] = useState<Record<string, { online_at: string; user_id: string }>>({})
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const presenceChannelRef = useRef<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const messageIdsRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<any>(null)
  const initializationRef = useRef(false)
  const optimisticMessagesRef = useRef<Set<string>>(new Set())

  // Filter messages based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages)
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredMessages(filtered)
    }
  }, [messages, searchQuery])

  // Group consecutive messages from the same user
  const groupMessages = (messages: ChatMessage[]) => {
    const groups: ChatMessage[][] = []
    let currentGroup: ChatMessage[] = []

    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1]
      const isSameUser = prevMessage && prevMessage.user_id === message.user_id
      const isWithinTimeLimit =
        prevMessage && new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 300000 // 5 minutes

      if (isSameUser && isWithinTimeLimit && currentGroup.length > 0) {
        currentGroup.push(message)
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [message]
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  // Mount component
  useEffect(() => {
    setMounted(true)
    return () => {
      setMounted(false)
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current)
        } catch (error) {
          console.error("Cleanup error:", error)
        }
      }
      if (presenceChannelRef.current) {
        try {
          supabase.removeChannel(presenceChannelRef.current)
        } catch (error) {
          console.error("Presence cleanup error:", error)
        }
      }
    }
  }, [supabase])

  // Initialize everything in one go
  useEffect(() => {
    if (!mounted || !userId || initializationRef.current) return

    const initializeChat = async () => {
      try {
        initializationRef.current = true
        setIsLoading(true)
        setError(null)

        // Get user profile and owner status
        const [profileResponse, ownerResponse] = await Promise.all([
          supabase.from("profiles").select("username, avatar_url, verified").eq("id", userId).single(),
          supabase.from("owners").select("id").eq("id", userId).single(),
        ])

        if (profileResponse.data?.username) {
          setUsername(profileResponse.data.username)
          setProfiles((prev) => ({
            ...prev,
            [userId]: profileResponse.data,
          }))
        }

        setCurrentUserIsOwner(!!ownerResponse.data)

        // Load messages with reply context
        const { data: messagesData, error: messagesError } = await supabase
          .from("global_chat_messages")
          .select(`
            id,
            user_id,
            message,
            created_at,
            reply_to_id,
            mentions
          `)
          .order("created_at", { ascending: false })
          .limit(100) // Increased limit for better search

        if (messagesError) throw messagesError

        // Get all user profiles and reply messages
        const userIds = [...new Set(messagesData?.map((msg) => msg.user_id).filter(Boolean) || [])]
        const replyToIds = [...new Set(messagesData?.map((msg) => msg.reply_to_id).filter(Boolean) || [])]

        const profileMap: Record<string, any> = {}
        const ownersMap: Record<string, boolean> = {}
        const replyMessagesMap: Record<string, any> = {}

        if (userIds.length > 0) {
          const [profilesResponse, ownersResponse] = await Promise.all([
            supabase.from("profiles").select("id, username, avatar_url, is_angle, verified").in("id", userIds),
            supabase.from("owners").select("id").in("id", userIds),
          ])

          if (profilesResponse.data) {
            profilesResponse.data.forEach((profile) => {
              if (profile?.id) profileMap[profile.id] = profile
            })
          }

          if (ownersResponse.data) {
            ownersResponse.data.forEach((owner) => {
              if (owner?.id) ownersMap[owner.id] = true
            })
          }

          setProfiles((prev) => ({ ...prev, ...profileMap }))
          setOwners(ownersMap)
        }

        // Get reply messages
        if (replyToIds.length > 0) {
          const { data: replyMessages } = await supabase
            .from("global_chat_messages")
            .select(`
              id,
              user_id,
              message,
              created_at
            `)
            .in("id", replyToIds)

          if (replyMessages) {
            replyMessages.forEach((replyMsg) => {
              if (replyMsg?.id) {
                replyMessagesMap[replyMsg.id] = {
                  ...replyMsg,
                  user: profileMap[replyMsg.user_id] || { username: "Unknown User" },
                }
              }
            })
          }
        }

        // Process messages with reply context
        const processedMessages = (messagesData || []).map((msg) => ({
          ...msg,
          user: profileMap[msg.user_id] || { username: "Unknown User" },
          isOwner: ownersMap[msg.user_id] || false,
          reply_to: msg.reply_to_id ? replyMessagesMap[msg.reply_to_id] || null : null,
        }))

        const orderedMessages = [...processedMessages].reverse()

        messageIdsRef.current.clear()
        orderedMessages.forEach((msg) => {
          if (msg.id) messageIdsRef.current.add(msg.id)
        })

        setMessages(orderedMessages)
        setupRealtime()
        setupPresence()
        setIsLoading(false)
      } catch (err) {
        console.error("Chat initialization error:", err)
        setError("Failed to load chat. Please refresh the page.")
        setIsLoading(false)
      }
    }

    initializeChat()
  }, [mounted, userId, supabase])

  // Simplified realtime setup
  const setupRealtime = useCallback(() => {
    if (!mounted) return

    try {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }

      const channelName = `global_chat_${Date.now()}`

      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "global_chat_messages",
          },
          async (payload) => {
            if (!mounted) return

            const newMessage = payload.new

            // Skip if we already have this message
            if (messageIdsRef.current.has(newMessage.id)) return
            messageIdsRef.current.add(newMessage.id)

            // Get user profile if not cached
            let userProfile = profiles[newMessage.user_id]
            if (!userProfile) {
              try {
                const { data } = await supabase
                  .from("profiles")
                  .select("id, username, avatar_url, is_angle")
                  .eq("id", newMessage.user_id)
                  .single()

                if (data) {
                  userProfile = data
                  setProfiles((prev) => ({ ...prev, [data.id]: data }))
                }
              } catch (error) {
                userProfile = { username: "Unknown User" }
              }
            }

            // Get reply message if exists
            let replyMessage = null
            if (newMessage.reply_to_id) {
              try {
                const { data } = await supabase
                  .from("global_chat_messages")
                  .select(`
                    id,
                    user_id,
                    message,
                    created_at
                  `)
                  .eq("id", newMessage.reply_to_id)
                  .single()

                if (data) {
                  replyMessage = {
                    ...data,
                    user: profiles[data.user_id] || { username: "Unknown User" },
                  }
                }
              } catch (error) {
                console.error("Error fetching reply message:", error)
              }
            }

            const processedMessage = {
              ...newMessage,
              user: userProfile || { username: "Unknown User" },
              isOwner: owners[newMessage.user_id] || false,
              reply_to: replyMessage,
            }

            // Handle optimistic updates for current user
            if (newMessage.user_id === userId) {
              setMessages((prev) => {
                // Find and replace optimistic message
                const optimisticIndex = prev.findIndex(
                  (msg) =>
                    msg.isOptimistic &&
                    msg.user_id === newMessage.user_id &&
                    msg.message === newMessage.message &&
                    Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 10000, // Within 10 seconds
                )

                if (optimisticIndex !== -1) {
                  // Replace optimistic message with real one
                  const newMessages = [...prev]
                  const optimisticId = prev[optimisticIndex].optimisticId
                  if (optimisticId) {
                    optimisticMessagesRef.current.delete(optimisticId)
                  }
                  newMessages[optimisticIndex] = processedMessage
                  return newMessages
                } else {
                  // Add new message if no optimistic version found
                  return [...prev, processedMessage]
                }
              })
            } else {
              // For other users, just add the message
              setMessages((prev) => [...prev, processedMessage])
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "global_chat_messages",
          },
          (payload) => {
            if (!mounted) return

            const deletedId = payload.old?.id
            if (deletedId) {
              messageIdsRef.current.delete(deletedId)
              setMessages((prev) => prev.filter((msg) => msg.id !== deletedId))
            }
          },
        )
        .subscribe((status) => {
          if (!mounted) return

          if (status === "SUBSCRIBED") {
            setRealtimeConnected(true)
            setOnlineUsers(0) // Will be updated by presence tracking
            channelRef.current = channel
          } else if (status === "CHANNEL_ERROR") {
            setRealtimeConnected(false)
          }
        })
    } catch (error) {
      console.error("Error setting up realtime:", error)
      setRealtimeConnected(false)
    }
  }, [mounted, supabase, profiles, owners, userId])

  const setupPresence = useCallback(() => {
    if (!mounted || !userId) return

    try {
      // Clean up existing presence channel
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }

      const presenceChannel = supabase.channel("online-users", {
        config: {
          presence: {
            key: userId,
          },
        },
      })

      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const newState = presenceChannel.presenceState()
          setPresenceState(newState)

          // Extract user IDs who are online
          const onlineIds = new Set<string>()

          Object.values(newState).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              if (presence.user_id) {
                onlineIds.add(presence.user_id)
              }
            })
          })

          setOnlineUserIds(onlineIds)
          setOnlineUsers(onlineIds.size)
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          console.log("User joined:", key, newPresences)
        })
        .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
          console.log("User left:", key, leftPresences)
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            // Track current user's presence
            await presenceChannel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            })
            presenceChannelRef.current = presenceChannel
          }
        })
    } catch (error) {
      console.error("Error setting up presence:", error)
    }
  }, [mounted, userId, supabase])

  // Auto scroll to bottom
  useEffect(() => {
    if (mounted && filteredMessages.length > 0 && !searchQuery) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    }
  }, [mounted, filteredMessages.length, searchQuery])

  // Scroll button logic
  useEffect(() => {
    if (!mounted) return

    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [mounted])

  const handleOptimisticUpdate = (message: ChatMessage) => {
    if (!mounted) return

    // Track optimistic message
    if (message.optimisticId) {
      optimisticMessagesRef.current.add(message.optimisticId)
    }

    setMessages((prev) => [...prev, message])
  }

  const handleReply = (message: ChatMessage) => {
    if (!mounted) return
    setReplyTo(message)
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!mounted) return

    try {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      messageIdsRef.current.delete(messageId)

      const { error } = await supabase.from("global_chat_messages").delete().eq("id", messageId)

      if (error) {
        console.error("Error deleting message:", error)
        toast?.({
          title: "Error",
          description: "Failed to delete message",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error in delete handler:", err)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!mounted) return null

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8 telegram-chat-bg">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connection Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw size={16} />
          Refresh Page
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full telegram-chat-bg">
        <div className="border-b bg-background/95 backdrop-blur p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t bg-background p-4">
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-lg" />
            <Skeleton className="h-12 w-12 rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessages(filteredMessages)

  return (
    <div className="flex flex-col h-full max-w-full overflow-x-hidden bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
        <div className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md">
                  <span className="text-primary-foreground font-bold text-lg">💬</span>
                </div>
                {realtimeConnected && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Global Chat</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {realtimeConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-green-600 font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-amber-600 font-medium">Connecting...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowSearch(!showSearch)}>
                <Search size={18} />
              </Button>
              {onlineUsers > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200/50 dark:border-green-800/30">
                  <Users size={14} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">{onlineUsers}</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search messages or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-muted/50"
                />
              </div>
              {searchQuery && (
                <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-9 px-3 text-xs">
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages Container with Telegram Background */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden telegram-chat-bg">
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full p-6">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-16 h-16 mx-auto bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl">{searchQuery ? "🔍" : "💬"}</span>
              </div>
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "No messages found" : "Welcome to Global Chat!"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? `No messages match "${searchQuery}". Try a different search term.`
                    : "Connect with the community and start chatting!"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {searchQuery && (
              <div className="mx-4 mb-3 p-3 bg-blue-50/90 dark:bg-blue-900/30 backdrop-blur-sm rounded-xl text-sm text-blue-700 dark:text-blue-300 shadow-sm">
                Found {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""} matching "
                {searchQuery}"
              </div>
            )}
            {messageGroups.map((group, index) => (
              <TelegramMessageGroup
                key={`${group[0].user_id}-${index}`}
                messages={group}
                currentUserId={userId}
                currentUsername={username}
                onReply={handleReply}
                onDelete={handleDeleteMessage}
                currentUserIsOwner={currentUserIsOwner}
                onlineUserIds={onlineUserIds}
                searchQuery={searchQuery}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-32 right-6 h-12 w-12 rounded-full shadow-xl border-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-white/20 backdrop-blur-sm z-50"
          onClick={scrollToBottom}
        >
          <ArrowDown size={20} />
        </Button>
      )}

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="p-3">
          <EnhancedMessageInput
            userId={userId}
            onOptimisticUpdate={handleOptimisticUpdate}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            profiles={profiles}
          />
        </div>
      </div>
    </div>
  )
}
