import { ShimmerCard, ShimmerProfile } from "@/components/ui/shimmer-loader"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header shimmer */}
      <div className="space-y-4">
        <div className="shimmer-bg h-8 w-64 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        <div className="shimmer-bg h-4 w-96 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>

      {/* Profile section */}
      <ShimmerProfile />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </div>
    </div>
  )
}
