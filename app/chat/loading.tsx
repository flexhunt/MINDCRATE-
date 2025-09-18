import { ShimmerListItem } from "@/components/ui/shimmer-loader"

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b p-4">
        <div className="shimmer-bg h-6 w-32 rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-1 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerListItem key={i} className={i % 3 === 0 ? "ml-12" : ""} />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="shimmer-bg h-12 w-full rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer" />
      </div>
    </div>
  )
}
