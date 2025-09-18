import { ShimmerCard } from "@/components/ui/shimmer-loader"

export default function ShopLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="shimmer-bg h-8 w-32 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        <div className="shimmer-bg h-10 w-40 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>

      {/* Balance card */}
      <ShimmerCard className="h-24" />

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <ShimmerCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  )
}
