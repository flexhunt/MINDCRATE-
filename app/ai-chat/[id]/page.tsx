import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { getConversations, getConversationMessages } from "@/app/actions/ai-chat"
import { ConversationList } from "@/components/ai-chat/conversation-list"
import { ConversationClient } from "./conversation-client"
import NewAppShell from "@/components/layout/new-app-shell"

export const dynamic = "force-dynamic"

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient(cookies())

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login?redirect=/ai-chat/" + params.id)
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  // Get conversations
  const conversations = await getConversations()

  // Find the current conversation
  const conversation = conversations.find((c) => c.id === params.id)

  if (!conversation) {
    notFound()
  }

  // Get messages for this conversation
  const messages = await getConversationMessages(params.id)

  return (
    <NewAppShell user={session.user} profile={profile} currentPath="/ai-chat">
      <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden border-r md:block md:w-80">
          <ConversationList conversations={conversations} />
        </div>

        {/* Conversation */}
        <div className="flex flex-1 flex-col">
          <ConversationClient conversationId={params.id} initialMessages={messages} title={conversation.title} />
        </div>
      </div>
    </NewAppShell>
  )
}
