import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const userOnly = searchParams.get("userOnly") === "true"

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

    let query = supabase
      .from("research_papers")
      .select(`
        *,
        paper_tags(tag)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (userOnly && user) {
      query = query.eq("uploaded_by", user.id)
    } else {
      query = query.eq("is_public", true)
    }

    if (category) {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,abstract.ilike.%${search}%,authors.cs.{${search}}`)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: papers, error } = await query

    if (error) {
      console.error("Error fetching papers:", error)
      return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase.from("research_papers").select("*", { count: "exact", head: true })

    if (userOnly && user) {
      countQuery = countQuery.eq("uploaded_by", user.id)
    } else {
      countQuery = countQuery.eq("is_public", true)
    }

    if (category) {
      countQuery = countQuery.eq("category", category)
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,abstract.ilike.%${search}%,authors.cs.{${search}}`)
    }

    const { count } = await countQuery

    return NextResponse.json({
      papers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Error in papers list API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
