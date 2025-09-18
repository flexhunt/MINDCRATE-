import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { topicId: string } }) {
  try {
    const topicId = params.topicId

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

    // Get questions for the topic
    const { data: questions, error } = await supabase
      .from("questionnaire_questions")
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Error fetching questions:", error)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    // Get topic details
    const { data: topic, error: topicError } = await supabase
      .from("questionnaire_topics")
      .select("*")
      .eq("id", topicId)
      .single()

    if (topicError) {
      console.error("Error fetching topic:", topicError)
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    return NextResponse.json({ topic, questions })
  } catch (error) {
    console.error("Error in questions API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
