"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface VerifiedBadgeProps {
  verified?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  showTooltip?: boolean
}

export default function VerifiedBadge({
  verified = false,
  size = "md",
  className,
  showTooltip = true,
}: VerifiedBadgeProps) {
  if (!verified) return null

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const sizePixels = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  return (
    <Image
      src="/images/verified-badge.png"
      alt="Verified"
      width={sizePixels[size]}
      height={sizePixels[size]}
      className={cn("inline-block ml-1 select-none", sizeClasses[size], className)}
      title={showTooltip ? "Verified Account" : undefined}
      draggable={false}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitUserDrag: "none",
        WebkitTouchCallout: "none",
        pointerEvents: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  )
}
