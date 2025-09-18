"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface OwnerBadgeProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  context?: "chat" | "profile" | "article" | "minimal"
}

const sizeMap = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
}

const contextStyles = {
  chat: "ml-1 opacity-90 hover:opacity-100 hover:scale-110",
  profile: "ml-2 hover:scale-110",
  article: "ml-1.5",
  minimal: "ml-0.5",
}

export default function OwnerBadge({ size = "md", className, context = "minimal" }: OwnerBadgeProps) {
  const dimension = sizeMap[size]

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200",
        contextStyles[context],
        className,
      )}
      title="Site Owner"
    >
      <Image
        src="/images/owner-badge.png"
        alt="Owner"
        width={dimension}
        height={dimension}
        className={cn(
          "transition-all duration-200",
          "filter drop-shadow-sm",
          context === "chat" && "hover:drop-shadow-md",
          context === "profile" && "hover:drop-shadow-lg",
        )}
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "none",
          WebkitTouchCallout: "none",
          WebkitUserDrag: "none",
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        draggable={false}
      />
    </div>
  )
}
