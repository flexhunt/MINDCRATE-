import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

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

    let query = supabase
      .from("questionnaire_topics")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (category) {
      query = query.eq("category", category)
    }

    const { data: topics, error } = await query

    if (error) {
      console.error("Error fetching topics:", error)
      return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 })
    }

    return NextResponse.json({ topics })
  } catch (error) {
    console.error("Error in topics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
