"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
          className="max-w-[300px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, "_blank")}
        />
      </div>
    )
  }

  if (type === "audio") {
    return (
      <div className="mt-2">
        <audio controls className="w-full max-w-[300px]">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="mt-2">
        <video controls className="w-full max-w-[300px] max-h-[200px] rounded-lg">
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </div>
    )
  }

  return null
}

function MessageContent({ message, currentUsername }: { message: string; currentUsername: string | null }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = message.match(urlRegex)

  if (!urls) {
    return (
      <MessageWithMentions
        message={message}
        currentUsername={currentUsername}
        className="text-sm leading-relaxed break-words"
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
            // Check if this URL is a media URL
            const { isMedia } = isMediaUrl(part)

            // If it's a media URL, show a shorter version
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

            // Otherwise show the full URL
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
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
}

export function MessageGroup({
  messages,
  currentUserId,
  currentUsername,
  onReply,
  onDelete,
  currentUserIsOwner = false,
  onlineUserIds = new Set(),
}: MessageGroupProps) {
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

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

  // Clean styling for everyone (including owners)
  return (
    <div className={`flex gap-3 mb-4 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar - only show for first message and not current user */}
      {!isCurrentUser && (
        <Link href={`/u/${firstMessage.user?.username || "unknown"}`} className="shrink-0">
          <div className="relative">
            <Avatar className="h-8 w-8 ring-1 ring-background shadow-sm cursor-pointer hover:ring-primary/50 transition-all">
              <AvatarImage src={firstMessage.user?.avatar_url || ""} alt={firstMessage.user?.username || "User"} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
                {(firstMessage.user?.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            {isUserOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse" />
            )}
          </div>
        </Link>
      )}

      <div className={`flex flex-col max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"}`}>
        {/* Username and badges - only for first message */}
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground">{firstMessage.user?.username || "Unknown"}</span>
              {/* Show owner badge for owners */}
              {userIsOwner && <OwnerBadge size="sm" />}
              {/* Show verified badge for verified users (including owners if they're also verified) */}
              <VerifiedBadge verified={firstMessage.user?.verified} size="sm" />
            </div>
            {isAngle && <BadgeCheck size={14} className="text-blue-500" title="AI Assistant" />}
            {isUserOnline && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Online</span>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="group relative"
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              {/* Reply preview */}
              {message.reply_to && (
                <div
                  className={`mb-1 p-2 rounded-lg border-l-2 bg-muted/50 max-w-xs ${
                    isCurrentUser ? "border-l-primary/60" : "border-l-muted-foreground/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Replying to <span className="font-medium">{message.reply_to.user?.username || "Unknown"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{message.reply_to.message}</div>
                </div>
              )}

              {/* Message bubble - clean styling for everyone */}
              <div
                className={`px-3 py-2 rounded-2xl shadow-sm transition-all duration-200 ${
                  isCurrentUser
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                    : "bg-background border border-border/50"
                } ${index === 0 ? (isCurrentUser ? "rounded-tr-md" : "rounded-tl-md") : ""} ${
                  index === messages.length - 1 ? (isCurrentUser ? "rounded-br-md" : "rounded-bl-md") : ""
                }`}
              >
                <MessageContent message={message.message} currentUsername={currentUsername} />

                {/* Timestamp on last message */}
                {index === messages.length - 1 && (
                  <div className={`text-xs mt-1 ${isCurrentUser ? "text-blue-100" : "text-muted-foreground/70"}`}>
                    {formatMessageTime(message.created_at)}
                  </div>
                )}
              </div>

              {/* Message actions */}
              {hoveredMessageId === message.id && (
                <div
                  className={`absolute top-0 ${
                    isCurrentUser ? "left-0 -translate-x-full" : "right-0 translate-x-full"
                  } flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg animate-in fade-in-0 duration-200`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => onReply?.(message)}
                    title="Reply"
                  >
                    <Reply size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => handleCopy(message.message, message.id)}
                    title="Copy message"
                  >
                    {copiedMessageId === message.id ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>

                  {canDeleteMessage(message) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(message.id)}
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
