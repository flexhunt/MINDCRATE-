"use client"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { Crown } from "lucide-react"
import { UserBadgeDisplay } from "@/components/badges/user-badge-display"
import { useState, useEffect } from "react"

interface ChatMessageProps {
  id: string
  userId: string
  username: string
  message: string
  createdAt: string
  avatarUrl?: string
  isOwner?: boolean
  selectedBadge?: {
    id: string
    name: string
    display_name: string
    description?: string
    icon: string
    color: string
    rarity: string
  } | null
}

function isMediaUrl(url: string): { isMedia: boolean; type: "image" | "audio" | "video" | "none" } {
  try {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname.toLowerCase()

    // Check for image extensions
    if (
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".png") ||
      path.endsWith(".gif") ||
      path.endsWith(".webp") ||
      path.endsWith(".svg")
    ) {
      return { isMedia: true, type: "image" }
    }

    // Check for audio extensions
    if (path.endsWith(".mp3") || path.endsWith(".wav") || path.endsWith(".ogg") || path.endsWith(".m4a")) {
      return { isMedia: true, type: "audio" }
    }

    // Check for video extensions
    if (path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov")) {
      return { isMedia: true, type: "video" }
    }

    return { isMedia: false, type: "none" }
  } catch (e) {
    return { isMedia: false, type: "none" }
  }
}

function MediaRenderer({ url, type }: { url: string; type: "image" | "audio" | "video" }) {
  if (type === "image") {
    return (
      <div className="mt-2">
        <img
          src={url || "/placeholder.svg"}
          alt="Shared image"
          className="max-w-[300px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(url, "_blank")}
        />
      </div>
    )
  }

  if (type === "audio") {
    return (
      <div className="mt-2">
        <audio controls className="w-full max-w-[300px]">
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      </div>
    )
  }

  if (type === "video") {
    return (
      <div className="mt-2">
        <video controls className="w-full max-w-[300px] max-h-[200px] rounded-lg">
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </div>
    )
  }

  return null
}

export function ChatMessageItem({
  id,
  userId,
  username,
  message,
  createdAt,
  avatarUrl,
  isOwner = false,
  selectedBadge,
}: ChatMessageProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true })

  // Process message to detect media URLs
  const [processedContent, setProcessedContent] = useState<{
    text: string
    mediaItems: Array<{ url: string; type: "image" | "audio" | "video" }>
  }>({ text: message, mediaItems: [] })

  useEffect(() => {
    // Simple URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = message.match(urlRegex)

    if (!urls) {
      setProcessedContent({ text: message, mediaItems: [] })
      return
    }

    const textContent = message
    const mediaItems: Array<{ url: string; type: "image" | "audio" | "video" }> = []

    // Process each URL in the message
    urls.forEach((url) => {
      const { isMedia, type } = isMediaUrl(url)

      if (isMedia && type !== "none") {
        mediaItems.push({ url, type })
        // Keep the URL as clickable link in text but media will render separately
      }
    })

    setProcessedContent({ text: textContent, mediaItems })
  }, [message])

  return (
    <div className="flex items-start gap-2 py-2 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <Link href={`/u/${username}`} className="shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
          {avatarUrl ? (
            <Image
              src={avatarUrl || "/placeholder.svg"}
              alt={username}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/u/${username}`} className="font-semibold text-sm hover:underline">
            {username}
          </Link>

          {selectedBadge && <UserBadgeDisplay badge={selectedBadge} size="sm" />}

          {isOwner && <Crown size={16} className="text-yellow-500" fill="currentColor" aria-label="Premium Owner" />}

          <span className="text-xs text-gray-500">{timeAgo}</span>
        </div>

        <div className="text-sm break-words">
          {/* Render the text with clickable links */}
          {processedContent.text.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
            if (part.match(/https?:\/\/[^\s]+/)) {
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {part}
                </a>
              )
            }
            return part
          })}

          {/* Render media items */}
          {processedContent.mediaItems.map((media, index) => (
            <MediaRenderer key={index} url={media.url} type={media.type} />
          ))}
        </div>
      </div>
    </div>
  )
}
