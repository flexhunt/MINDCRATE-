export interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
  reply_to_id?: string | null
  user?: {
    id?: string
    username?: string
    avatar_url?: string | null
  }
  reply_to?: ChatMessage | null
  isOwner?: boolean
  isBot?: boolean
}

export interface ChatUser {
  id: string
  username: string
  avatar_url?: string | null
}

export interface BotCommand {
  command: string
  description: string
  handler: (args: string[], userId: string) => Promise<string>
}
