"use client"

import { EnhancedMessageInput } from "./enhanced-message-input"
import type { ChatMessage } from "@/lib/chat/chat-types"

interface MessageInputProps {
  userId: string
  onOptimisticUpdate: (message: ChatMessage) => void
  replyTo?: ChatMessage | null
  onCancelReply?: () => void
  profiles?: Record<string, any>
}

export function MessageInput(props: MessageInputProps) {
  return <EnhancedMessageInput {...props} />
}
