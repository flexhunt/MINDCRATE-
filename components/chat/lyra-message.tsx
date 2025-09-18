import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Stars } from "lucide-react"
import type { ChatMessage } from "@/lib/chat/chat-types"

interface LyraMessageProps {
  message: ChatMessage
}

export function LyraMessage({ message }: LyraMessageProps) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-blue-900/10 rounded-lg border border-purple-200/50 dark:border-purple-800/30">
      <div className="relative">
        <Avatar className="h-10 w-10 ring-2 ring-purple-200 dark:ring-purple-800">
          <AvatarImage src={message.user?.avatar_url || "/placeholder.svg"} alt={message.user?.username} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white">
            {message.user?.username?.charAt(0).toUpperCase() || "L"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
          <Sparkles size={8} className="text-white fill-current" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-purple-700 dark:text-purple-300">{message.user?.username}</span>
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          >
            <Stars size={10} className="mr-1" />
            AI Friend
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="text-sm text-foreground leading-relaxed">
          <p className="break-words">{message.message}</p>
        </div>
      </div>
    </div>
  )
}
