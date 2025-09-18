"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface ShimmerLoaderProps {
  className?: string
  children?: React.ReactNode
}

export function ShimmerLoader({ className, children }: ShimmerLoaderProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="shimmer-bg rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer">
        {children}
      </div>
    </div>
  )
}

// Card shimmer loader
export function ShimmerCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <ShimmerLoader className="h-4 w-3/4" />
        <ShimmerLoader className="h-3 w-1/2" />
        <div className="space-y-2">
          <ShimmerLoader className="h-3 w-full" />
          <ShimmerLoader className="h-3 w-5/6" />
        </div>
        <div className="flex gap-2">
          <ShimmerLoader className="h-6 w-16 rounded-full" />
          <ShimmerLoader className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}

// List item shimmer
export function ShimmerListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-4 p-4", className)}>
      <ShimmerLoader className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <ShimmerLoader className="h-4 w-1/3" />
        <ShimmerLoader className="h-3 w-1/2" />
      </div>
      <ShimmerLoader className="h-8 w-20 rounded" />
    </div>
  )
}

// Table shimmer
export function ShimmerTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3">
          <ShimmerLoader className="h-4 w-8" />
          <ShimmerLoader className="h-4 w-32" />
          <ShimmerLoader className="h-4 w-24" />
          <ShimmerLoader className="h-4 w-16" />
          <ShimmerLoader className="h-8 w-20 rounded" />
        </div>
      ))}
    </div>
  )
}

// Profile shimmer
export function ShimmerProfile() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <ShimmerLoader className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <ShimmerLoader className="h-6 w-32" />
          <ShimmerLoader className="h-4 w-24" />
          <ShimmerLoader className="h-4 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <ShimmerCard />
        <ShimmerCard />
        <ShimmerCard />
      </div>
    </div>
  )
}
