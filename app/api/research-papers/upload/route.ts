import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const authors = formData.get("authors") as string
    const abstract = formData.get("abstract") as string
    const keywords = formData.get("keywords") as string
    const category = formData.get("category") as string
    const journal = formData.get("journal") as string
    const publicationDate = formData.get("publicationDate") as string
    const doi = formData.get("doi") as string

    if (!file || !title || !authors) {
      return NextResponse.json({ error: "File, title, and authors are required" }, { status: 400 })
    }

    // Validate file
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size must be less than 50MB" }, { status: 400 })
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${user.id}/${timestamp}-${file.name}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from("research-papers")
      .upload(filename, file, { upsert: true })

    if (uploadError) {
      console.error("File upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("research-papers").getPublicUrl(filename)

    // Parse authors and keywords arrays
    const authorsArray = authors.split(",").map((author) => author.trim())
    const keywordsArray = keywords ? keywords.split(",").map((keyword) => keyword.trim()) : []

    // Extract basic text content for search (placeholder)
    const content = `${title} ${abstract} ${authorsArray.join(" ")} ${keywordsArray.join(" ")}`

    // Insert paper metadata into database
    const { data: paperData, error: dbError } = await supabase
      .from("research_papers")
      .insert({
        title,
        authors: authorsArray,
        abstract,
        content,
        pdf_url: urlData.publicUrl,
        doi: doi || null,
        publication_date: publicationDate ? new Date(publicationDate) : null,
        journal: journal || null,
        keywords: keywordsArray,
        category: category || null,
        uploaded_by: user.id,
        file_size: file.size,
        is_public: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("research-papers").remove([filename])
      return NextResponse.json({ error: "Failed to save paper metadata" }, { status: 500 })
    }

    // Insert tags if provided
    if (keywordsArray.length > 0) {
      const tagInserts = keywordsArray.map((tag) => ({
        paper_id: paperData.id,
        tag: tag.toLowerCase(),
      }))

      await supabase.from("paper_tags").insert(tagInserts)
    }

    return NextResponse.json({
      success: true,
      paper: paperData,
      message: "Research paper uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading research paper:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
