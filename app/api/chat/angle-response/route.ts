import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationId } = body

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate AI response using OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 1000,
      }),
    })

    const aiResponse = await response.json()
    const assistantMessage = aiResponse.choices?.[0]?.message?.content || "Sorry, I could not generate a response."

    // Save messages to database
    await supabase.from("chat_messages").insert([
      {
        conversation_id: conversationId,
        user_id: user.id,
        content: message,
        role: "user",
      },
      {
        conversation_id: conversationId,
        user_id: user.id,
        content: assistantMessage,
        role: "assistant",
      },
    ])

    return NextResponse.json({ response: assistantMessage })
  } catch (error) {
    console.error("Error generating AI response:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
