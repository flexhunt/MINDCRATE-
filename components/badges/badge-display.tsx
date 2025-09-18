import { type Badge, BADGE_TIERS } from "@/lib/badges/badge-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BadgeDisplayProps {
  badge: Badge
  size?: "sm" | "md" | "lg"
}

export function BadgeDisplay({ badge, size = "md" }: BadgeDisplayProps) {
  const sizeMap = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-lg",
  }

  const tier = badge.badge_tier ? BADGE_TIERS[badge.badge_tier as keyof typeof BADGE_TIERS] : null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`rounded-full flex items-center justify-center ${sizeMap[size]}`}
            style={{ backgroundColor: `${badge.badge_color}20` }}
          >
            <span className="font-bold" style={{ color: badge.badge_color }}>
              {badge.badge_name.charAt(0)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="px-3 py-1.5">
          <p className="font-medium" style={{ color: badge.badge_color }}>
            {badge.badge_name}
          </p>
          {badge.badge_description && <p className="text-xs text-muted-foreground">{badge.badge_description}</p>}
          {tier && (
            <p className="text-xs mt-1" style={{ color: tier.color }}>
              {tier.name} Tier
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
