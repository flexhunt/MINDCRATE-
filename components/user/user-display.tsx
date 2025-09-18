"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import VerifiedBadge from "@/components/ui/verified-badge"
import { cn } from "@/lib/utils"

interface UserDisplayProps {
  user: {
    id?: string
    name?: string
    username?: string
    email?: string
    avatar_url?: string
    verified?: boolean
  }
  showAvatar?: boolean
  avatarSize?: "sm" | "md" | "lg"
  badgeSize?: "sm" | "md" | "lg"
  className?: string
}

export default function UserDisplay({
  user,
  showAvatar = true,
  avatarSize = "md",
  badgeSize = "md",
  className,
}: UserDisplayProps) {
  const avatarSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const displayName = user.name || user.username || user.email || "Anonymous"
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showAvatar && (
        <Avatar className={avatarSizes[avatarSize]}>
          <AvatarImage src={user.avatar_url || ""} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex items-center">
        <span className="font-medium">{displayName}</span>
        <VerifiedBadge verified={user.verified} size={badgeSize} />
      </div>
    </div>
  )
}
