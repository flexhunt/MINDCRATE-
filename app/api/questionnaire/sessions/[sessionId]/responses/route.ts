import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    const body = await request.json()
    const { responses } = body // Array of { questionId, responseValue, responseData }

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

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from("questionnaire_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Insert responses
    const responseInserts = responses.map((response: any) => ({
      user_id: user.id,
      topic_id: session.topic_id,
      question_id: response.questionId,
      response_value: response.responseValue,
      response_data: response.responseData || null,
    }))

    const { error: responseError } = await supabase.from("questionnaire_responses").insert(responseInserts)

    if (responseError) {
      console.error("Error saving responses:", responseError)
      return NextResponse.json({ error: "Failed to save responses" }, { status: 500 })
    }

    // Update session
    const { error: updateError } = await supabase
      .from("questionnaire_sessions")
      .update({
        answered_questions: responses.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)

    if (updateError) {
      console.error("Error updating session:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in responses API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
