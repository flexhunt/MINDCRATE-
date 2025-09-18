import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topicId } = body

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

    // Get question count for the topic
    const { count: questionCount } = await supabase
      .from("questionnaire_questions")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topicId)

    // Create new session
    const { data: session, error } = await supabase
      .from("questionnaire_sessions")
      .insert({
        user_id: user.id,
        topic_id: topicId,
        total_questions: questionCount || 0,
        answered_questions: 0,
        session_data: {},
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Error in session creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
