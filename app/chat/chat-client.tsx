"use client"

import { useEffect, useState } from "react"
import { ChatContainer } from "@/components/chat/chat-container"
import { Skeleton } from "@/components/ui/skeleton"
import { usePresence } from "@/hooks/use-presence"

interface ChatClientProps {
  userId: string
}

export default function ChatClient({ userId }: ChatClientProps) {
  const [mounted, setMounted] = useState(false)

  usePresence(userId)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <ChatContainer userId={userId} />
}
