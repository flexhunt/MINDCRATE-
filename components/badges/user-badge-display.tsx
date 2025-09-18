import type { Badge } from "@/lib/badges/badge-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserBadgeDisplayProps {
  badge: Badge | null
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
}

export function UserBadgeDisplay({ badge, size = "sm", showTooltip = true }: UserBadgeDisplayProps) {
  if (!badge) return null

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const BadgeElement = (
    <span
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses[size]} font-medium`}
      style={{
        backgroundColor: `${badge.color}20`,
        color: badge.color,
        border: `1px solid ${badge.color}40`,
      }}
    >
      <span className="mr-1">{badge.icon}</span>
      <span className="px-1">{badge.display_name}</span>
    </span>
  )

  if (!showTooltip) return BadgeElement

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{BadgeElement}</TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{badge.display_name}</p>
            {badge.description && <p className="text-xs text-muted-foreground">{badge.description}</p>}
            <p className="text-xs capitalize mt-1" style={{ color: badge.color }}>
              {badge.rarity}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
