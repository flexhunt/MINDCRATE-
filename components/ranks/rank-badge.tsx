import Image from "next/image"
import { getAllRanks } from "@/lib/ranks/rank-utils"

interface RankBadgeProps {
  rank: string
  size?: "sm" | "md" | "lg"
  showName?: boolean
}

export function RankBadge({ rank, size = "md", showName = false }: RankBadgeProps) {
  const ranks = getAllRanks()
  const rankInfo = ranks[rank] || ranks.bronze

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  const badgeSize = sizeMap[size]

  return (
    <div className="flex items-center gap-1">
      <div className="relative" style={{ width: badgeSize, height: badgeSize }}>
        <Image
          src={`/badges/${rank}.png`}
          alt={rankInfo.name}
          width={badgeSize}
          height={badgeSize}
          className="object-contain"
          onError={(e) => {
            // Fallback if image doesn't exist
            const target = e.target as HTMLImageElement
            target.src = `/badges/bronze.png`
          }}
        />
      </div>

      {showName && (
        <span className="text-sm font-medium" style={{ color: rankInfo.color }}>
          {rankInfo.name}
        </span>
      )}
    </div>
  )
}
