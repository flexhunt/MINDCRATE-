import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")
    const sortBy = searchParams.get("sortBy") || "relevance" // relevance, date, citations

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

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

    // Build the search query using PostgreSQL full-text search
    let searchQuery = supabase
      .from("research_papers")
      .select(`
        *,
        paper_tags(tag),
        citations_count:citations(count)
      `)
      .eq("is_public", true)

    // Apply full-text search
    searchQuery = searchQuery.or(`
      title.ilike.%${query}%,
      abstract.ilike.%${query}%,
      content.ilike.%${query}%,
      authors.cs.{${query}},
      keywords.cs.{${query}}
    `)

    // Apply category filter
    if (category && category !== "all") {
      searchQuery = searchQuery.eq("category", category)
    }

    // Apply sorting
    switch (sortBy) {
      case "date":
        searchQuery = searchQuery.order("publication_date", { ascending: false, nullsLast: true })
        break
      case "citations":
        // This would require a more complex query with citation counts
        searchQuery = searchQuery.order("view_count", { ascending: false })
        break
      default: // relevance
        searchQuery = searchQuery.order("created_at", { ascending: false })
    }

    // Apply pagination
    const offset = (page - 1) * limit
    searchQuery = searchQuery.range(offset, offset + limit - 1)

    const { data: papers, error } = await searchQuery

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("research_papers")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true)
      .or(`
        title.ilike.%${query}%,
        abstract.ilike.%${query}%,
        content.ilike.%${query}%,
        authors.cs.{${query}},
        keywords.cs.{${query}}
      `)

    // Enhance results with citation information
    const enhancedPapers = await Promise.all(
      papers.map(async (paper) => {
        // Get citation count
        const { count: citationCount } = await supabase
          .from("citations")
          .select("*", { count: "exact", head: true })
          .eq("cited_paper_id", paper.id)

        // Get recent citations
        const { data: recentCitations } = await supabase
          .from("citations")
          .select(`
            *,
            citing_paper:research_papers!citations_paper_id_fkey(title, authors)
          `)
          .eq("cited_paper_id", paper.id)
          .order("created_at", { ascending: false })
          .limit(3)

        return {
          ...paper,
          citation_count: citationCount || 0,
          recent_citations: recentCitations || [],
        }
      }),
    )

    return NextResponse.json({
      papers: enhancedPapers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      searchQuery: query,
    })
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
