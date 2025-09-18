import { ShimmerCard } from "@/components/ui/shimmer-loader"

export default function QuizLoading() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="shimmer-bg h-10 w-48 mx-auto rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
        <div className="shimmer-bg h-4 w-96 mx-auto rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>

      {/* Level selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
        <ShimmerCard className="h-32" />
      </div>

      {/* Leaderboard */}
      <ShimmerCard className="h-64" />
    </div>
  )
}
