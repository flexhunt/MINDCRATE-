"use client"

import { useEffect, useState } from "react"
import { LinkIcon } from "lucide-react"

interface ProfileUrlProps {
  username: string
}

export default function ProfileUrl({ username }: ProfileUrlProps) {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!origin) return null

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">Your profile is visible at:</p>
      <a
        href={`/u/${username}`}
        className="text-primary hover:underline font-medium flex items-center justify-center"
        target="_blank"
        rel="noopener noreferrer"
      >
        {origin}/u/{username}
        <LinkIcon className="h-3 w-3 ml-1" />
      </a>
    </div>
  )
}
