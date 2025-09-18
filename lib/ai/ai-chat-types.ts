export interface AIMessage {
  id: string
  conversation_id: string
  role: "user" | "assistant" | "system"
  content: string
  created_at: string
  user_id: string
}

export interface AIConversation {
  id: string
  user_id: string
  title: string
  last_message: string | null
  created_at: string
  updated_at: string
  messages: AIMessage[]
}

export interface AIConversationSummary {
  id: string
  title: string
  last_message: string | null
  created_at: string
  updated_at: string
}
