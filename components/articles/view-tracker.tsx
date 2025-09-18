"use client"

import { useEffect } from "react"

interface ViewTrackerProps {
  articleId: string
}

/**
 * Fires POST /api/articles/[id]/view exactly once per mount.
 * - de-bounced by the API (one view per user ⇢ article per 24 h).
 */
export default function ViewTracker({ articleId }: ViewTrackerProps) {
  useEffect(() => {
    // ignore during prerender / build
    if (!articleId) return

    // no await → fire-and-forget, keeps UI snappy
    fetch(`/api/articles/${articleId}/view`, { method: "POST" }).catch(() => {
      /* ignore network hiccups */
    })
  }, [articleId])

  return null
}
