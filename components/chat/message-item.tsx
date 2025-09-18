"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Reply, Trash2, Crown, MoreVertical, Copy, Check, BadgeCheck, Star, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { MessageWithMentions } from "./message-with-mentions"

interface MessageItemProps {
  message: any
  currentUserId: string
  currentUsername: string | null
  onReply?: (message: any) => void
  onDelete?: (messageId: string) => void
  isOwner?: boolean
  currentUserIsOwner?: boolean
  isOnline?: boolean
  searchQuery?: string
}

export function MessageItem({
  message,
  currentUserId,
  currentUsername,
  onReply,
  onDelete,
  isOwner = false,
  currentUserIsOwner = false,
  isOnline = false,
  searchQuery = "",
}: MessageItemProps) {
  const isCurrentUser = message.user_id === currentUserId
  const formattedTime = formatDistanceToNow(new Date(message.created_at), { addSuffix: true })

  // Check if this is Angle (but don't show AI indicators)
  const isAngle = message.user?.username === "angle" || message.user?.is_angle === true

  // Check if this user is an owner
  const userIsOwner = message.isOwner || isOwner

  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isReplying, setIsReplying] = useState(false)
  const [showReplyIcon, setShowReplyIcon] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)
  const isDragging = useRef(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  // Determine if current user can delete this message
  const canDelete = isCurrentUser || currentUserIsOwner

  const handleDelete = () => {
    if (onDelete && canDelete && window.confirm("Are you sure you want to delete this message?")) {
      onDelete(message.id)
    }
  }

  const handleReply = () => {
    if (onReply) {
      setIsReplying(true)
      onReply(message)
      setTimeout(() => setIsReplying(false), 500)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy message:", error)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    swipeStartX.current = touch.clientX
    swipeStartY.current = touch.clientY
    isDragging.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - swipeStartX.current
    const deltaY = touch.clientY - swipeStartY.current

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isDragging.current = true

      // Prevent text selection and scrolling
      e.preventDefault()

      // Calculate swipe offset
      const maxSwipe = 80
      let offset = deltaX * 0.7

      // Direction logic: swipe right to reply (for all messages)
      if (deltaX > 0) {
        offset = Math.min(maxSwipe, offset)
        setShowReplyIcon(offset > 20)
      } else {
        offset = 0
        setShowReplyIcon(false)
      }

      setSwipeOffset(offset)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDragging.current && swipeOffset > 40 && onReply) {
      // Trigger reply
      handleReply()
      // Vibrate
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }

    // Reset with smooth animation
    setSwipeOffset(0)
    setShowReplyIcon(false)
    swipeStartX.current = null
    swipeStartY.current = null
    isDragging.current = false
  }

  // Position actions menu to stay within screen bounds
  const getActionsPosition = () => {
    if (!actionsRef.current || !messageRef.current) return {}

    const messageRect = messageRef.current.getBoundingClientRect()
    const actionsRect = actionsRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = isCurrentUser ? -actionsRect.width - 8 : messageRect.width + 8
    let top = 0

    // Adjust horizontal position if it goes off screen
    if (isCurrentUser && messageRect.left + left < 0) {
      left = -messageRect.left + 8
    } else if (!isCurrentUser && messageRect.right + left + actionsRect.width > viewportWidth) {
      left = viewportWidth - messageRect.right - actionsRect.width - 8
    }

    // Adjust vertical position if it goes off screen
    if (messageRect.top + top + actionsRect.height > viewportHeight) {
      top = viewportHeight - messageRect.top - actionsRect.height - 8
    }

    return { left: `${left}px`, top: `${top}px` }
  }

  // Update actions position when shown
  useEffect(() => {
    if (showActions && actionsRef.current) {
      const position = getActionsPosition()
      Object.assign(actionsRef.current.style, position)
    }
  }, [showActions, isCurrentUser])

  // Special styling for owners
  if (userIsOwner && !isAngle) {
    return (
      <div className="group relative select-none">
        {/* Premium glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-yellow-200/20 to-amber-200/20 rounded-2xl blur-xl" />

        <div
          className={`relative flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 via-yellow-50/80 to-amber-50/80 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-amber-200/20 ${
            isReplying ? "scale-95 opacity-70" : ""
          } ${isCurrentUser ? "flex-row-reverse" : ""}`}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          style={{
            transform: `translateX(${swipeOffset}px) ${isReplying ? "scale(0.95)" : "scale(1)"}`,
            transition: swipeOffset === 0 ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        >
          <Link href={`/u/${message.user?.username || "unknown"}`} className="shrink-0">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-amber-400 shadow-lg cursor-pointer hover:ring-amber-300 transition-all">
                <AvatarImage src={message.user?.avatar_url || ""} alt={message.user?.username || "User"} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white font-bold text-sm">
                  {(message.user?.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Premium crown overlay */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown size={10} className="text-white" />
              </div>
              {/* Online indicator */}
              {isOnline && (
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
              )}
            </div>
          </Link>

          <div
            ref={messageRef}
            className={`flex flex-col min-w-0 flex-1 ${isCurrentUser ? "items-end" : "items-start"}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Premium Header */}
            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 bg-clip-text text-transparent select-none">
                  {message.user?.username || "Unknown"}
                </span>

                {/* Premium Owner Badge */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full shadow-sm">
                  <Sparkles size={8} className="text-white" />
                  <span className="text-xs font-bold text-white tracking-wide select-none">OWNER</span>
                  <Star size={8} className="text-white" />
                </div>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium select-none">
                {formattedTime}
              </span>
            </div>

            {/* Message Content */}
            <div className="relative max-w-[85%] md:max-w-[70%]">
              {/* Reply Preview */}
              {message.reply_to && (
                <div className="mb-1 p-2 rounded-lg border-l-2 border-l-amber-400 bg-amber-50/50 dark:bg-amber-950/20 select-none">
                  <div className="text-xs text-amber-700 dark:text-amber-300 mb-0.5 font-medium">
                    Replying to <span className="font-bold">{message.reply_to.user?.username || "Unknown"}</span>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 line-clamp-1">
                    {message.reply_to.message}
                  </div>
                </div>
              )}

              {/* Premium Message Bubble */}
              <div
                className={`relative px-3 py-2 rounded-xl shadow-lg transition-all duration-200 select-none ${
                  isCurrentUser
                    ? "bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-white shadow-amber-200/30"
                    : "bg-gradient-to-br from-white via-amber-50 to-yellow-50 dark:from-amber-950/50 dark:via-yellow-950/50 dark:to-amber-950/50 border border-amber-200/50 dark:border-amber-800/30 text-foreground shadow-amber-100/20"
                }`}
              >
                {/* Sparkle effects */}
                <div className="absolute top-1 right-2 w-1 h-1 bg-white/60 rounded-full animate-pulse" />
                <div className="absolute bottom-2 left-3 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-500" />

                <MessageWithMentions
                  message={message.message}
                  currentUsername={currentUsername}
                  className="text-sm leading-relaxed break-words font-medium select-none"
                  searchQuery={searchQuery}
                />
              </div>

              {/* Swipe Reply Indicator */}
              {showReplyIcon && (
                <div
                  className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full shadow-xl animate-in zoom-in-50 duration-200"
                  style={{
                    opacity: Math.min(swipeOffset / 40, 1),
                    transform: `translateY(-50%) scale(${Math.min(swipeOffset / 40, 1)})`,
                  }}
                >
                  <Reply size={18} className="text-white" />
                </div>
              )}

              {/* Message Actions */}
              {showActions && (
                <div
                  ref={actionsRef}
                  className="absolute z-50 flex items-center gap-1 bg-amber-50/95 dark:bg-amber-950/95 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30 rounded-lg p-1 shadow-lg animate-in fade-in-0 duration-200"
                  style={{ position: "absolute" }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                    onClick={handleReply}
                    title="Reply"
                  >
                    <Reply size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                    onClick={handleCopy}
                    title="Copy message"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </Button>

                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600"
                      onClick={handleDelete}
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                      >
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="bg-amber-50/95 dark:bg-amber-950/95 border-amber-200/50"
                    >
                      <DropdownMenuItem onClick={handleReply} className="text-amber-700 dark:text-amber-300">
                        <Reply size={14} className="mr-2" />
                        Reply
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopy} className="text-amber-700 dark:text-amber-300">
                        {copied ? (
                          <Check size={14} className="mr-2 text-green-500" />
                        ) : (
                          <Copy size={14} className="mr-2" />
                        )}
                        {copied ? "Copied!" : "Copy"}
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular user styling
  return (
    <div
      className={`group flex items-start gap-2 py-2 px-2 rounded-xl transition-all duration-300 hover:bg-muted/30 select-none ${
        isReplying ? "scale-95 opacity-70" : ""
      } ${isCurrentUser ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        transform: `translateX(${swipeOffset}px) ${isReplying ? "scale(0.95)" : "scale(1)"}`,
        transition: swipeOffset === 0 ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
      }}
    >
      <Link href={`/u/${message.user?.username || "unknown"}`} className="shrink-0">
        <div className="relative">
          <Avatar className="h-8 w-8 ring-1 ring-background shadow-sm cursor-pointer hover:ring-primary/50 transition-all">
            <AvatarImage src={message.user?.avatar_url || ""} alt={message.user?.username || "User"} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs">
              {(message.user?.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
          )}
        </div>
      </Link>

      <div
        ref={messageRef}
        className={`flex flex-col min-w-0 flex-1 ${isCurrentUser ? "items-end" : "items-start"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Message Header */}
        <div className={`flex items-center gap-2 mb-0.5 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-foreground select-none">
              {message.user?.username || "Unknown"}
            </span>

            {/* Show blue verification tick for Angle */}
            {isAngle && <BadgeCheck size={14} className="text-blue-500" title="Verified" />}
          </div>
          <span className="text-xs text-muted-foreground select-none">{formattedTime}</span>
        </div>

        {/* Message Content */}
        <div className="relative max-w-[85%] md:max-w-[70%]">
          {/* Reply Preview */}
          {message.reply_to && (
            <div
              className={`mb-1 p-1.5 rounded-lg border-l-2 bg-muted/50 select-none ${
                isCurrentUser ? "border-l-primary/60" : "border-l-muted-foreground/30"
              }`}
            >
              <div className="text-xs text-muted-foreground mb-0.5">
                Replying to <span className="font-medium">{message.reply_to.user?.username || "Unknown"}</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">{message.reply_to.message}</div>
            </div>
          )}

          {/* Main Message */}
          <div
            className={`px-3 py-1.5 rounded-xl shadow-sm transition-all duration-200 select-none ${
              isCurrentUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                : "bg-background border border-border/50"
            }`}
            data-message-content
          >
            <MessageWithMentions
              message={message.message}
              currentUsername={currentUsername}
              className="text-xs sm:text-sm leading-relaxed break-words select-none"
              searchQuery={searchQuery}
            />
          </div>

          {/* Swipe Reply Indicator */}
          {showReplyIcon && (
            <div
              className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-primary rounded-full shadow-xl animate-in zoom-in-50 duration-200"
              style={{
                opacity: Math.min(swipeOffset / 40, 1),
                transform: `translateY(-50%) scale(${Math.min(swipeOffset / 40, 1)})`,
              }}
            >
              <Reply size={18} className="text-white" />
            </div>
          )}

          {/* Message Actions */}
          {showActions && (
            <div
              ref={actionsRef}
              className="absolute z-50 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg animate-in fade-in-0 duration-200"
              style={{ position: "absolute" }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={handleReply}
                title="Reply"
              >
                <Reply size={14} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={handleCopy}
                title="Copy message"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete message"
                >
                  <Trash2 size={14} />
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={handleReply}>
                    <Reply size={14} className="mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    {copied ? <Check size={14} className="mr-2 text-green-500" /> : <Copy size={14} className="mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageItem
