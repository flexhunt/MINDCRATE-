import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    const paperId = params.paperId

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

    // Get citations for this paper
    const { data: citations, error } = await supabase
      .from("citations")
      .select(`
        *,
        citing_paper:research_papers!citations_paper_id_fkey(
          id,
          title,
          authors,
          publication_date,
          journal
        )
      `)
      .eq("cited_paper_id", paperId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching citations:", error)
      return NextResponse.json({ error: "Failed to fetch citations" }, { status: 500 })
    }

    // Get papers that this paper cites
    const { data: references, error: refError } = await supabase
      .from("citations")
      .select(`
        *,
        cited_paper:research_papers!citations_cited_paper_id_fkey(
          id,
          title,
          authors,
          publication_date,
          journal
        )
      `)
      .eq("paper_id", paperId)
      .order("created_at", { ascending: false })

    if (refError) {
      console.error("Error fetching references:", refError)
      return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 })
    }

    return NextResponse.json({
      citations: citations || [],
      references: references || [],
      citationCount: citations?.length || 0,
      referenceCount: references?.length || 0,
    })
  } catch (error) {
    console.error("Error in citations API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { paperId: string } }) {
  try {
    const paperId = params.paperId
    const body = await request.json()
    const { citedPaperId, citationText, pageNumber, context } = body

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

    // Verify both papers exist and user has access
    const { data: paper } = await supabase.from("research_papers").select("id, uploaded_by").eq("id", paperId).single()

    const { data: citedPaper } = await supabase.from("research_papers").select("id").eq("id", citedPaperId).single()

    if (!paper || !citedPaper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    }

    // Only allow the paper owner to add citations
    if (paper.uploaded_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized to modify this paper" }, { status: 403 })
    }

    // Insert citation
    const { data: citation, error } = await supabase
      .from("citations")
      .insert({
        paper_id: paperId,
        cited_paper_id: citedPaperId,
        citation_text: citationText,
        page_number: pageNumber,
        context: context,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating citation:", error)
      return NextResponse.json({ error: "Failed to create citation" }, { status: 500 })
    }

    return NextResponse.json({ success: true, citation })
  } catch (error) {
    console.error("Error in citation creation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
