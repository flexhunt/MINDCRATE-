"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { AIConversationSummary } from "@/lib/ai/ai-chat-types"
import { MessageSquarePlus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react"
import { createNewConversation, deleteConversation, updateConversationTitle } from "@/app/actions/ai-chat"
import { useToast } from "@/components/ui/toast/use-toast"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "@/lib/utils/date-utils"

interface ConversationListProps {
  conversations: AIConversationSummary[]
}

export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleNewConversation = async () => {
    try {
      setIsCreating(true)
      const id = await createNewConversation()
      window.location.href = `/ai-chat/${id}`
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast({
        title: "Error creating conversation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      setDeletingId(id)
      await deleteConversation(id)

      // If we're deleting the current conversation, redirect to /ai-chat
      if (pathname === `/ai-chat/${id}`) {
        window.location.href = "/ai-chat"
      } else {
        // Force a refresh to update the list
        window.location.reload()
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
      toast({
        title: "Error deleting conversation",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const startEditing = (conversation: AIConversationSummary) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveTitle = async (id: string) => {
    try {
      if (!editTitle.trim()) {
        return cancelEditing()
      }

      await updateConversationTitle(id, editTitle.trim())
      cancelEditing()

      // Force a refresh to update the title
      window.location.reload()
    } catch (error) {
      console.error("Error updating title:", error)
      toast({
        title: "Error updating title",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  // Helper function to safely format the date
  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return "Unknown time"

    try {
      // Make sure we have a valid date string
      const date = new Date(dateString)

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown time"
      }

      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Unknown time"
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* New conversation button - always visible and prominent */}
      <div className="sticky top-0 z-10 bg-background p-4 shadow-sm">
        <Button
          onClick={handleNewConversation}
          className="w-full justify-center md:justify-start gap-2"
          disabled={isCreating}
          size="lg"
        >
          <MessageSquarePlus className="h-5 w-5" />
          {isCreating ? "Creating..." : "New conversation"}
        </Button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground p-4">No conversations yet. Start a new one!</p>
          ) : (
            conversations.map((conversation) => (
              <div key={conversation.id} className="group relative">
                {editingId === conversation.id ? (
                  <div className="flex items-center space-x-2 p-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(conversation.id)
                        if (e.key === "Escape") cancelEditing()
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveTitle(conversation.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Link
                    href={`/ai-chat/${conversation.id}`}
                    className={cn(
                      "flex flex-col rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                      pathname === `/ai-chat/${conversation.id}` && "bg-accent",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{conversation.title}</span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(conversation.updated_at)}</span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {conversation.last_message || "No messages yet"}
                    </span>
                  </Link>
                )}

                {editingId !== conversation.id && (
                  <div className="absolute right-2 top-2 flex opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        startEditing(conversation)
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id)
                      }}
                      disabled={deletingId === conversation.id}
                    >
                      {deletingId === conversation.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
