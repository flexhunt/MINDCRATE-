"use client"

import type { AIMessage } from "@/lib/ai/ai-chat-types"
import { cn } from "@/lib/utils"
import { Bot, Copy, Check, User } from "lucide-react"
import { useState } from "react"
import ReactMarkdown from "react-markdown"

interface AIMessageProps {
  message: AIMessage
  isLastMessage?: boolean
}

export function AIMessageComponent({ message, isLastMessage }: AIMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  // Format timestamp as "just now" for new messages
  const timestamp = "just now"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start gap-4 px-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isLastMessage && "animate-fadeIn",
      )}
    >
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message content */}
      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{isUser ? "You" : "Mindcrate AI"}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <div
          className={cn(
            "mt-1 max-w-3xl rounded-lg px-4 py-3",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Copy button - only for assistant messages */}
      {!isUser && (
        <button
          onClick={copyToClipboard}
          className="absolute right-6 top-2 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Copy message"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      )}
    </div>
  )
}
