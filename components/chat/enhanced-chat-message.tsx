"use client"

import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import VerifiedBadge from "@/components/ui/verified-badge"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: {
    id: string
    content: string
    created_at: string
    user: {
      id: string
      name?: string
      username?: string
      avatar_url?: string
      verified?: boolean
    }
  }
  isOwn?: boolean
  className?: string
}

export default function EnhancedChatMessage({ message, isOwn = false, className }: ChatMessageProps) {
  const displayName = message.user.name || message.user.username || "Anonymous"
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className={cn("flex gap-3 p-3 hover:bg-muted/50 transition-colors", className)}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.user.avatar_url || ""} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{displayName}</span>
          <VerifiedBadge verified={message.user.verified} size="sm" />
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
        </div>

        <div className="text-sm break-words">{message.content}</div>
      </div>
    </div>
  )
}
