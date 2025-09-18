"use client"

interface MessageWithMentionsProps {
  message: string
  currentUsername?: string
  className?: string
}

export function MessageWithMentions({ message, currentUsername, className = "" }: MessageWithMentionsProps) {
  // Function to highlight mentions in message text
  const renderMessageWithMentions = (text: string) => {
    if (!text) return text

    // Split by mentions but keep the mentions
    const parts = text.split(/(@\w+)/g)

    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.substring(1)
        const isCurrentUser = currentUsername && username.toLowerCase() === currentUsername.toLowerCase()
        const isAngle = username.toLowerCase() === "angle"

        return (
          <span
            key={index}
            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-sm font-medium transition-colors ${
              isCurrentUser
                ? "bg-primary/20 text-primary border border-primary/30"
                : isAngle
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {part}
            {isAngle && <span className="ml-1">🤖</span>}
          </span>
        )
      }
      return part
    })
  }

  return <div className={className}>{renderMessageWithMentions(message)}</div>
}
