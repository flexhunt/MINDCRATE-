import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { articleId: string } }) {
  try {
    const body = await request.json()
    const { action } = body // 'like', 'save', 'share'
    const articleId = params.articleId

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

    if (action === "like") {
      // Toggle like
      const { data: existingLike } = await supabase
        .from("article_likes")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .single()

      if (existingLike) {
        await supabase.from("article_likes").delete().eq("article_id", articleId).eq("user_id", user.id)
      } else {
        await supabase.from("article_likes").insert({ article_id: articleId, user_id: user.id })
      }
    } else if (action === "save") {
      // Toggle save
      const { data: existingSave } = await supabase
        .from("saved_articles")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .single()

      if (existingSave) {
        await supabase.from("saved_articles").delete().eq("article_id", articleId).eq("user_id", user.id)
      } else {
        await supabase.from("saved_articles").insert({ article_id: articleId, user_id: user.id })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing article interaction:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
