import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getConversations } from "@/app/actions/ai-chat"
import { ConversationList } from "@/components/ai-chat/conversation-list"
import NewAppShell from "@/components/layout/new-app-shell"
import { Bot } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AIChatPage() {
  const supabase = createClient(cookies())

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/ai-chat")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Get conversations
  const conversations = await getConversations()

  return (
    <NewAppShell user={session.user} profile={profile} currentPath="/ai-chat">
      <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
        {/* Sidebar - visible on all devices */}
        <div className="border-b md:border-b-0 md:border-r md:w-80">
          <ConversationList conversations={conversations} />
        </div>

        {/* Empty state - hidden on mobile if there are conversations */}
        <div
          className={`flex flex-1 flex-col items-center justify-center p-4 md:p-8 ${conversations.length > 0 ? "hidden md:flex" : "flex"}`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Mindcrate AI</h1>
          <p className="mt-2 text-center text-muted-foreground max-w-md">
            Your personal AI assistant for self-improvement, productivity, and mental wellness. Start a new conversation
            or select an existing one.
          </p>
        </div>
      </div>
    </NewAppShell>
  )
}
