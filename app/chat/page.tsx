"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChatContainer } from "@/components/chat/chat-container"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...")
        const supabase = createClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          throw sessionError
        }

        if (!session) {
          console.log("No session found, redirecting to login")
          router.replace("/login")
          return
        }

        console.log("User authenticated:", session.user.id)
        setUser(session.user)
      } catch (err) {
        console.error("Chat auth error:", err)
        setError("Authentication failed. Please try logging in again.")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Chat Error</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col">
        <ChatContainer userId={user.id} />
      </div>
    </div>
  )
}
