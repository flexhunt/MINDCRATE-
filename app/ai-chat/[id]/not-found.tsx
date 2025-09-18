"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function NotFoundContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Chat Not Found</h1>
      <p className="text-xl mb-6">
        Sorry, the chat <span className="font-semibold">{id}</span> doesn't exist or has been removed.
      </p>
      <Link
        href="/ai-chat"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Back to Chats
      </Link>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
