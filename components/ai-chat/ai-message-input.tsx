"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendIcon, Loader2, AlertCircle, UserIcon as Male, UserIcon as Female, User } from "lucide-react"
import { toast } from "@/components/ui/toast/use-toast"

// Add a new type for the persona
type Persona = "default" | "male" | "female"

interface AIMessageInputProps {
  conversationId: string
  onSendMessage: (message: string) => Promise<void>
  disabled?: boolean
}

export function AIMessageInput({ conversationId, onSendMessage, disabled = false }: AIMessageInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [persona, setPersona] = useState<Persona>("default")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const adjustHeight = () => {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }

    textarea.addEventListener("input", adjustHeight)
    adjustHeight()

    return () => {
      textarea.removeEventListener("input", adjustHeight)
    }
  }, [message])

  // Clear error when message changes
  useEffect(() => {
    if (error) setError(null)
  }, [message, error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSubmitting || disabled) return

    try {
      setIsSubmitting(true)
      setError(null)
      let userMessage = message.trim()

      // Add persona prefix if not default
      if (persona === "male") {
        userMessage = "/male " + userMessage
      } else if (persona === "female") {
        userMessage = "/female " + userMessage
      }

      setMessage("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      await onSendMessage(userMessage)
    } catch (error) {
      console.error("Error in message input:", error)
      setError("Failed to send message. Please try again.")
      toast({
        title: "Error sending message",
        description: "Please try again or refresh the page.",
        variant: "destructive",
      })
      // Restore the message so the user doesn't lose their input
      setMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex flex-col rounded-lg border bg-background p-2 shadow-sm">
        {/* Persona selector */}
        <div className="flex items-center mb-2 space-x-2">
          <span className="text-xs text-muted-foreground">AI Persona:</span>
          <div className="flex space-x-1">
            <Button
              type="button"
              size="sm"
              variant={persona === "default" ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() => setPersona("default")}
            >
              <User className="h-4 w-4 mr-1" />
              Default
            </Button>
            <Button
              type="button"
              size="sm"
              variant={persona === "male" ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() => setPersona("male")}
            >
              <Male className="h-4 w-4 mr-1" />
              Male
            </Button>
            <Button
              type="button"
              size="sm"
              variant={persona === "female" ? "default" : "outline"}
              className="h-8 px-2"
              onClick={() => setPersona("female")}
            >
              <Female className="h-4 w-4 mr-1" />
              Female
            </Button>
          </div>
        </div>

        <div className="flex items-end">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Mindcrate AI..."
            className="min-h-10 max-h-[200px] flex-1 resize-none border-0 p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSubmitting || disabled}
          />
          <Button
            type="submit"
            size="icon"
            className="ml-2 h-10 w-10 shrink-0 rounded-full"
            disabled={!message.trim() || isSubmitting || disabled}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendIcon className="h-5 w-5" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-500">
          <AlertCircle className="mr-1 h-4 w-4" />
          {error}
        </div>
      )}
      <p className="mt-2 text-xs text-center text-muted-foreground">
        Mindcrate AI is powered by Claude 3 Haiku via OpenRouter. Responses may not always be accurate.
      </p>
    </form>
  )
}
