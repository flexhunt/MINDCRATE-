"use client"

import { useEffect, useRef, useState } from "react"
import type { AIMessage } from "@/lib/ai/ai-chat-types"
import { AIMessageComponent } from "@/components/ai-chat/ai-message"
import { AIMessageInput } from "@/components/ai-chat/ai-message-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Bot } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/toast/use-toast"
import { TypingIndicator } from "@/components/ai-chat/typing-indicator"
import { sendMessage } from "@/app/actions/ai-chat"

// Add a function to extract persona from message
function extractPersona(message: string): string {
  if (message.startsWith("/male")) return "Male"
  if (message.startsWith("/female")) return "Female"
  return "Default"
}

interface ConversationClientProps {
  conversationId: string
  initialMessages: AIMessage[]
  title: string
}

export function ConversationClient({ conversationId, initialMessages, title }: ConversationClientProps) {
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Scroll to bottom when messages change or typing state changes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    } else if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }

  useEffect(() => {
    // Use a short timeout to ensure the DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [messages, isTyping])

  // Update the handleSendMessage function to display the persona in the UI
  const handleSendMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return

    try {
      // Get persona for display
      const persona = extractPersona(userMessage)

      // Optimistically add user message immediately
      const tempUserMsgId = `temp-user-${Date.now()}`
      const displayMessage = userMessage.replace("/male", "").replace("/female", "").trim()

      const userMsg: AIMessage = {
        id: tempUserMsgId,
        role: "user",
        content: displayMessage,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])

      // Show typing indicator
      setIsTyping(true)

      // Send message to API
      const result = await sendMessage(conversationId, userMessage)

      // Hide typing indicator
      setIsTyping(false)

      // Add AI response
      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.message,
        createdAt: new Date().toISOString(),
        // Add persona metadata
        metadata: { persona },
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error("Error sending message:", error)
      setIsTyping(false)
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex items-center border-b p-4 bg-background md:hidden">
        <Button asChild variant="ghost" size="icon" className="mr-2">
          <Link href="/ai-chat">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="truncate font-semibold">{title}</h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">
                Start a conversation with Mindcrate AI by sending a message below.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <AIMessageComponent key={message.id} message={message} isLastMessage={index === messages.length - 1} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="group relative mb-4 flex items-start gap-4 px-4">
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border bg-background shadow">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Mindcrate AI</span>
                      <span className="text-xs text-muted-foreground">just now</span>
                    </div>
                    <div className="mt-1 rounded-lg bg-muted px-4 py-3">
                      <TypingIndicator className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input - fixed at bottom on mobile */}
      <div className="sticky bottom-0 border-t bg-background p-4 z-10">
        <div className="mx-auto max-w-3xl">
          <AIMessageInput conversationId={conversationId} onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  )
}
