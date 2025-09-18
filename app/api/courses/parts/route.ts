import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, parts } = body

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

    // Insert course parts
    const { data, error } = await supabase
      .from("course_parts")
      .insert(
        parts.map((part: any, index: number) => ({
          course_id: courseId,
          title: part.title,
          content: part.content,
          order_index: index,
          created_by: user.id,
        })),
      )
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, parts: data })
  } catch (error) {
    console.error("Error creating course parts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
