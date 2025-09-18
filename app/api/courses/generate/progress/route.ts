import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
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

    // Check course generation progress
    const { data: progress, error } = await supabase
      .from("course_generation_progress")
      .select("*")
      .eq("job_id", jobId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Progress not found" }, { status: 404 })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Error fetching course generation progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function addProgressUpdate(sessionId: string, data: any) {
  try {
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

    // Insert or update progress record
    const { error } = await supabase.from("course_generation_progress").upsert({
      job_id: sessionId,
      type: data.type,
      message: data.message,
      progress: data.progress,
      log_type: data.logType,
      indent: data.indent,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error updating progress:", error)
    }
  } catch (error) {
    console.error("Error in addProgressUpdate:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, ...data } = body

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await addProgressUpdate(sessionId, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST handler:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
