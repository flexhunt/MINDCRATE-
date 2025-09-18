"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Reply, Trash2, Copy, Check, BadgeCheck } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import Link from "next/link"
import { MessageWithMentions } from "./message-with-mentions"
import VerifiedBadge from "@/components/ui/verified-badge"
import OwnerBadge from "@/components/ui/owner-badge"

function isMediaUrl(url: string): { isMedia: boolean; type: "image" | "audio" | "video" | "none" } {
  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname.toLowerCase()

    if (
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".png") ||
      path.endsWith(".gif") ||
      path.endsWith(".webp") ||
      path.endsWith(".svg")
    ) {
      return { isMedia: true, type: "image" }
    }

    if (path.endsWith(".mp3") || path.endsWith(".wav") || path.endsWith(".ogg") || path.endsWith(".m4a")) {
      return { isMedia: true, type: "audio" }
    }

    if (path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov")) {
      return { isMedia: true, type: "video" }
    }

    return { isMedia: false, type: "none" }
  } catch (e) {
    return { isMedia: false, type: "none" }
  }
}

function MediaRenderer({ url, type }: { url: string; type: "image" | "audio" | "video" }) {
  if (type === "image") {
    return (
      <div className="mt-2">
        <img
          src={url || "/placeholder.svg"}
          alt="Shared image"
          className="max-w-[280px] max-h-[200px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
          onClick={() => window.open(url, "_blank")}
        />
      </div>
    )
  }

  if (type === "audio") {
    return (
      <div className="mt-2">
        <audio controls className="w-full max-w-[280px] rounded-lg">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="mt-2">
        <video controls className="w-full max-w-[280px] max-h-[200px] rounded-xl">
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </div>
    )
  }

  return null
}

function MessageContent({
  message,
  currentUsername,
  searchQuery,
}: { message: string; currentUsername: string | null; searchQuery?: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = message.match(urlRegex)

  if (!urls) {
    return (
      <MessageWithMentions
        message={message}
        currentUsername={currentUsername}
        className="text-sm leading-relaxed break-words"
        searchQuery={searchQuery}
      />
    )
  }

  // Check if message is ONLY a media URL and nothing else
  const isOnlyMediaUrl = message.trim() === urls[0].trim()
  const { isMedia, type } = isMediaUrl(urls[0])

  // If message is only a media URL, only show the media
  if (isOnlyMediaUrl && isMedia && type !== "none") {
    return <MediaRenderer url={urls[0]} type={type} />
  }

  // Otherwise, show both text and media
  const mediaItems: Array<{ url: string; type: "image" | "audio" | "video" }> = []

  urls.forEach((url) => {
    const { isMedia, type } = isMediaUrl(url)
    if (isMedia && type !== "none") {
      mediaItems.push({ url, type })
    }
  })

  return (
    <div>
      <div className="text-sm leading-relaxed break-words">
        {message.split(urlRegex).map((part, index) => {
          if (part.match(/https?:\/\/[^\s]+/)) {
            const { isMedia } = isMediaUrl(part)
            if (isMedia) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  [media]
                </a>
              )
            }
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {part}
              </a>
            )
          }
          return part
        })}
      </div>

      {mediaItems.map((media, index) => (
        <MediaRenderer key={index} url={media.url} type={media.type} />
      ))}
    </div>
  )
}

interface Message {
  id: string
  user_id: string
  message: string
  created_at: string
  reply_to?: {
    id: string
    message: string
    user?: { username: string }
  } | null
  user?: {
    username: string
    avatar_url?: string
    is_angle?: boolean
    verified?: boolean
  }
  isOwner?: boolean
  isOptimistic?: boolean
}

interface MessageGroupProps {
  messages: Message[]
  currentUserId: string
  currentUsername: string | null
  onReply?: (message: Message) => void
  onDelete?: (messageId: string) => void
  currentUserIsOwner?: boolean
  onlineUserIds?: Set<string>
  searchQuery?: string
}

export function TelegramMessageGroup({
  messages,
  currentUserId,
  currentUsername,
  onReply,
  onDelete,
  currentUserIsOwner = false,
  onlineUserIds = new Set(),
  searchQuery = "",
}: MessageGroupProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [swipeStates, setSwipeStates] = useState<Record<string, { offset: number; showReplyIcon: boolean }>>({})

  const swipeRefs = useRef<
    Record<
      string,
      {
        startX: number | null
        startY: number | null
        isDragging: boolean
        element: HTMLDivElement | null
        longPressTimer?: NodeJS.Timeout | null
      }
    >
  >({})

  const [contextMenu, setContextMenu] = useState<{
    messageId: string
    x: number
    y: number
    show: boolean
  }>({ messageId: "", x: 0, y: 0, show: false })

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLongPressing, setIsLongPressing] = useState(false)

  // Handle right-click context menu for desktop
  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    setContextMenu({
      messageId,
      x,
      y,
      show: true,
    })
  }

  // Handle long press for mobile
  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    const touch = e.touches[0]
    swipeRefs.current[messageId] = {
      startX: touch.clientX,
      startY: touch.clientY,
      isDragging: false,
      element: e.currentTarget as HTMLDivElement,
    }

    // Long press timer for context menu (1.5 seconds)
    const timer = setTimeout(() => {
      if (!swipeRefs.current[messageId]?.isDragging) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setContextMenu({
          messageId,
          x: touch.clientX,
          y: touch.clientY,
          show: true,
        })
        setIsLongPressing(true)
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]) // Triple vibration for context menu
        }
      }
    }, 1500) // 1.5 seconds for long press

    setLongPressTimer(timer)
  }

  const handleTouchMove = (e: React.TouchEvent, messageId: string) => {
    const swipeRef = swipeRefs.current[messageId]
    if (!swipeRef || swipeRef.startX === null || swipeRef.startY === null) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeRef.startX
    const deltaY = touch.clientY - swipeRef.startY

    // Clear long press timer if user moves significantly
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
        setLongPressTimer(null)
      }
      setIsLongPressing(false)
    }

    // Only handle horizontal swipes that are more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      swipeRef.isDragging = true
      e.preventDefault() // Prevent scrolling

      // Calculate swipe offset (only allow right swipe for reply)
      const maxSwipe = 80
      let offset = 0
      let showReplyIcon = false

      if (deltaX > 0) {
        // Right swipe
        offset = Math.min(maxSwipe, deltaX * 0.6)
        showReplyIcon = offset > 30
      }

      setSwipeStates((prev) => ({
        ...prev,
        [messageId]: { offset, showReplyIcon },
      }))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, messageId: string, message: Message) => {
    const swipeRef = swipeRefs.current[messageId]
    if (!swipeRef) return

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setIsLongPressing(false)

    const currentSwipeState = swipeStates[messageId]

    if (swipeRef.isDragging && currentSwipeState?.offset > 40 && onReply) {
      // Trigger reply
      onReply(message)
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }

    // Reset swipe state with animation
    setSwipeStates((prev) => ({
      ...prev,
      [messageId]: { offset: 0, showReplyIcon: false },
    }))

    // Clean up
    delete swipeRefs.current[messageId]
  }

  // Close context menu when clicking outside
  const handleCloseContextMenu = () => {
    setContextMenu({ messageId: "", x: 0, y: 0, show: false })
  }

  // Context menu actions
  const handleContextAction = (action: string, message: Message) => {
    switch (action) {
      case "reply":
        onReply?.(message)
        break
      case "copy":
        handleCopy(message.message, message.id)
        break
      case "delete":
        handleDelete(message.id)
        break
    }
    handleCloseContextMenu()
  }

  // Position context menu to stay within viewport
  const getContextMenuStyle = () => {
    const menuWidth = 200
    const menuHeight = 150
    const padding = 16

    let x = contextMenu.x
    let y = contextMenu.y

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding
    }
    if (x < padding) {
      x = padding
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      y = y - menuHeight - 20 // Show above the touch point
    }
    if (y < padding) {
      y = padding
    }

    return {
      left: x,
      top: y,
      position: "fixed" as const,
      zIndex: 1000,
    }
  }

  const handleCopy = async (message: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(message)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const handleDelete = (messageId: string) => {
    if (onDelete && window.confirm("Are you sure you want to delete this message?")) {
      onDelete(messageId)
    }
  }

  const canDeleteMessage = (message: Message) => {
    return message.user_id === currentUserId || currentUserIsOwner
  }

  if (!messages.length) return null

  const firstMessage = messages[0]
  const isCurrentUser = firstMessage.user_id === currentUserId
  const userIsOwner = firstMessage.isOwner
  const isAngle = firstMessage.user?.username === "angle" || firstMessage.user?.is_angle === true
  const isUserOnline = onlineUserIds.has(firstMessage.user_id)

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    if (isToday(date)) {
      return format(date, "HH:mm")
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`
    } else {
      return format(date, "MMM d, HH:mm")
    }
  }

  return (
    <div className={`flex gap-2 mb-3 px-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar - only show for first message and not current user */}
      {!isCurrentUser && (
        <Link href={`/u/${firstMessage.user?.username || "unknown"}`} className="shrink-0 mt-1">
          <div className="relative">
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm cursor-pointer hover:ring-primary/50 transition-all">
              <AvatarImage src={firstMessage.user?.avatar_url || ""} alt={firstMessage.user?.username || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                {(firstMessage.user?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            {isUserOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>
        </Link>
      )}

      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Username and badges - only for first message and not current user */}
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1 px-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{firstMessage.user?.username || "Unknown"}</span>
              {userIsOwner && <OwnerBadge size="sm" />}
              <VerifiedBadge verified={firstMessage.user?.verified} size="sm" />
              {isAngle && <BadgeCheck size={14} className="text-blue-500" title="AI Assistant" />}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1 w-full">
          {messages.map((message, index) => {
            const swipeState = swipeStates[message.id] || { offset: 0, showReplyIcon: false }

            return (
              <div
                key={message.id}
                className="group relative w-full"
                onContextMenu={(e) => handleContextMenu(e, message.id)}
              >
                <div
                  className="relative"
                  onTouchStart={(e) => handleTouchStart(e, message.id)}
                  onTouchMove={(e) => handleTouchMove(e, message.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, message.id, message)}
                  style={{
                    transform: `translateX(${isCurrentUser ? -swipeState.offset : swipeState.offset}px)`,
                    transition: swipeState.offset === 0 ? "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
                  }}
                >
                  {/* Reply preview */}
                  {message.reply_to && (
                    <div
                      className={`mb-2 p-2 rounded-lg border-l-4 bg-muted/30 max-w-xs ${
                        isCurrentUser ? "border-l-blue-500 ml-auto" : "border-l-primary"
                      }`}
                    >
                      <div className="text-xs font-medium text-primary mb-1">
                        {message.reply_to.user?.username || "Unknown"}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{message.reply_to.message}</div>
                    </div>
                  )}

                  {/* Message bubble - Telegram style */}
                  <div
                    className={`relative px-3 py-2 rounded-2xl shadow-sm transition-all duration-200 ${
                      isCurrentUser ? "bg-blue-500 text-white ml-auto" : "bg-background border border-border/50"
                    } ${
                      // Rounded corners based on position in group
                      index === 0 ? (isCurrentUser ? "rounded-tr-md" : "rounded-tl-md") : ""
                    } ${index === messages.length - 1 ? (isCurrentUser ? "rounded-br-md" : "rounded-bl-md") : ""}`}
                  >
                    <MessageContent
                      message={message.message}
                      currentUsername={currentUsername}
                      searchQuery={searchQuery}
                    />

                    {/* Timestamp on last message */}
                    {index === messages.length - 1 && (
                      <div className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-muted-foreground/70"}`}>
                        {formatMessageTime(message.created_at)}
                      </div>
                    )}

                    {/* Message tail for first message */}
                    {index === 0 && (
                      <div
                        className={`absolute top-0 w-3 h-3 ${
                          isCurrentUser
                            ? "right-0 translate-x-1 bg-blue-500"
                            : "left-0 -translate-x-1 bg-background border-l border-t border-border/50"
                        } transform rotate-45`}
                        style={{
                          clipPath: isCurrentUser
                            ? "polygon(0 100%, 100% 0, 100% 100%)"
                            : "polygon(0 0, 100% 0, 0 100%)",
                        }}
                      />
                    )}
                  </div>

                  {/* Swipe Reply Indicator */}
                  {swipeState.showReplyIcon && (
                    <div
                      className={`absolute top-1/2 ${
                        isCurrentUser ? "left-0 -translate-x-12" : "right-0 translate-x-12"
                      } transform -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-primary rounded-full shadow-lg`}
                      style={{
                        opacity: Math.min(swipeState.offset / 40, 1),
                        transform: `translateY(-50%) scale(${Math.min(swipeState.offset / 40, 1)})`,
                      }}
                    >
                      <Reply size={18} className="text-primary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {/* Telegram-style Context Menu */}
      {contextMenu.show && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={handleCloseContextMenu} />

          {/* Context Menu */}
          <div
            className="fixed z-50 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl shadow-2xl py-2 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-200"
            style={getContextMenuStyle()}
          >
            <div className="px-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                onClick={() => {
                  const message = messages.find((m) => m.id === contextMenu.messageId)
                  if (message) handleContextAction("reply", message)
                }}
              >
                <Reply size={18} className="text-blue-500" />
                <span>Reply</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/80 rounded-xl transition-colors"
                onClick={() => {
                  const message = messages.find((m) => m.id === contextMenu.messageId)
                  if (message) handleContextAction("copy", message)
                }}
              >
                {copiedMessageId === contextMenu.messageId ? (
                  <Check size={18} className="text-green-500" />
                ) : (
                  <Copy size={18} className="text-muted-foreground" />
                )}
                <span>{copiedMessageId === contextMenu.messageId ? "Copied!" : "Copy"}</span>
              </button>

              {(() => {
                const message = messages.find((m) => m.id === contextMenu.messageId)
                return message && canDeleteMessage(message) ? (
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    onClick={() => handleContextAction("delete", message)}
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                ) : null
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
