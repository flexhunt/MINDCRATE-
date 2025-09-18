import { ShimmerProfile, ShimmerCard } from "@/components/ui/shimmer-loader"

export default function ProfileLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <ShimmerProfile />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ShimmerCard className="h-20" />
        <ShimmerCard className="h-20" />
        <ShimmerCard className="h-20" />
        <ShimmerCard className="h-20" />
      </div>

      {/* Activity section */}
      <div className="space-y-4">
        <div className="shimmer-bg h-6 w-32 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        <ShimmerCard className="h-64" />
      </div>
    </div>
  )
}
