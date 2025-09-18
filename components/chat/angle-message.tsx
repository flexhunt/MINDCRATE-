import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, Sparkles } from "lucide-react"
import type { ChatMessage } from "@/lib/chat/chat-types"

interface AngleMessageProps {
  message: ChatMessage
}

export function AngleMessage({ message }: AngleMessageProps) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-lg border border-pink-200/50 dark:border-pink-800/30">
      <div className="relative">
        <Avatar className="h-10 w-10 ring-2 ring-pink-200 dark:ring-pink-800">
          <AvatarImage src={message.user?.avatar_url || "/placeholder.svg"} alt={message.user?.username} />
          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
            {message.user?.username?.charAt(0).toUpperCase() || "A"}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
          <Heart size={8} className="text-white fill-current" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-pink-700 dark:text-pink-300">{message.user?.username}</span>
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800"
          >
            <Sparkles size={10} className="mr-1" />
            AI Girlfriend
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
